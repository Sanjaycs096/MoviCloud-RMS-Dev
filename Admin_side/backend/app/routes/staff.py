from fastapi import APIRouter, HTTPException, Request, Query
from ..db import get_db
from ..schemas import (
    StaffIn, StaffUpdate, ShiftAssignment, AttendanceIn, 
    PerformanceLogIn, AttendanceStatus, ShiftType, LoginIn
)
from ..utils import hash_password, verify_password
from ..audit import log_audit
from datetime import datetime, date
from typing import Optional
from bson import ObjectId

router = APIRouter()


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_doc(v) if isinstance(v, dict) else str(v) if isinstance(v, ObjectId) else v for v in value]
            else:
                result[key] = value
        return result
    return doc


def to_object_id(id_str: str):
    """Convert string ID to ObjectId, or return the string if invalid"""
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str


# ============ AUTHENTICATION ============
@router.post('/login', tags=['auth'])
async def login(payload: LoginIn, request: Request):
    """Authenticate staff member and return user data"""
    db = get_db()
    coll = db.get_collection('staff')
    
    # Find user by email
    user = await coll.find_one({'email': payload.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail='Invalid email or password')
    
    # Check if user is active
    if not user.get('active', True):
        raise HTTPException(status_code=401, detail='Account is deactivated. Contact admin.')
    
    # Verify password
    if not verify_password(payload.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    
    # Log the login
    await log_audit(
        action='login',
        resource='staff',
        resourceId=str(user['_id']),
        userId=str(user['_id']),
        userName=user.get('name'),
        details={'email': payload.email},
        ip=request.client.host if request.client else None
    )
    
    # Return user data (without password)
    user_data = {
        'id': str(user['_id']),
        'email': user['email'],
        'name': user.get('name', ''),
        'role': user.get('role', 'waiter'),
        'phone': user.get('phone'),
        'shift': user.get('shift'),
        'department': user.get('department'),
    }
    
    return {'success': True, 'user': user_data}


# ============ STAFF CRUD ============
@router.get('/', tags=['staff'])
async def list_staff(
    role: Optional[str] = None,
    active: Optional[bool] = None,
    shift: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all staff members with optional filters"""
    db = get_db()
    coll = db.get_collection('staff')
    filt = {}
    if role:
        # Case-insensitive role filter using regex
        filt['role'] = {'$regex': f'^{role}$', '$options': 'i'}
    if active is not None:
        filt['active'] = active
    if shift:
        filt['shift'] = shift
    docs = await coll.find(filt, {'password_hash': 0}).skip(skip).limit(limit).to_list(1000)
    return serialize_doc(docs)


@router.get('/stats', tags=['staff'])
async def get_staff_stats():
    """Get staff statistics by role"""
    db = get_db()
    coll = db.get_collection('staff')
    pipeline = [
        {'$group': {'_id': '$role', 'count': {'$sum': 1}}},
        {'$sort': {'_id': 1}}
    ]
    result = await coll.aggregate(pipeline).to_list(100)
    
    # Get active/inactive counts
    active_count = await coll.count_documents({'active': True})
    inactive_count = await coll.count_documents({'active': False})
    total = await coll.count_documents({})
    
    return {
        'byRole': {r['_id']: r['count'] for r in result},
        'active': active_count,
        'inactive': inactive_count,
        'total': total
    }


@router.get('/{id}', tags=['staff'])
async def get_staff(id: str):
    """Get a single staff member by ID"""
    db = get_db()
    coll = db.get_collection('staff')
    doc = await coll.find_one({'_id': to_object_id(id)})
    if not doc:
        raise HTTPException(status_code=404, detail='Not found')
    doc.pop('password_hash', None)
    return serialize_doc(doc)


@router.post('/', tags=['staff'])
async def create_staff(payload: StaffIn, request: Request):
    """Create a new staff member with role assignment"""
    db = get_db()
    coll = db.get_collection('staff')
    existing = await coll.find_one({'email': payload.email})
    if existing:
        raise HTTPException(status_code=409, detail='Email already exists')

    # Enforce only one admin account
    if payload.role and payload.role.value == 'admin':
        admin_exists = await coll.find_one({'role': 'admin'})
        if admin_exists:
            raise HTTPException(status_code=400, detail='An admin account already exists. Only one admin is allowed.')

    pw_hash = hash_password(payload.password) if payload.password else None
    doc = {
        'name': payload.name,
        'email': payload.email,
        'role': payload.role.value if payload.role else 'waiter',
        'password_hash': pw_hash,
        'phone': payload.phone,
        'shift': payload.shift.value if payload.shift else 'morning',
        'department': payload.department,
        'salary': payload.salary,
        'hireDate': payload.hireDate.isoformat() if payload.hireDate else None,
        'active': payload.active if payload.active is not None else True,
        'createdAt': datetime.utcnow().isoformat()
    }
    res = await coll.insert_one(doc)
    created = await coll.find_one({'_id': res.inserted_id})
    created.pop('password_hash', None)
    
    await log_audit(
        action='create_staff',
        resource='staff',
        resourceId=str(res.inserted_id),
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        details={'email': payload.email, 'role': payload.role.value if payload.role else 'waiter'},
        ip=request.client.host if request.client else None
    )
    return serialize_doc(created)


@router.put('/{id}', tags=['staff'])
async def update_staff(id: str, payload: StaffUpdate, request: Request):
    """Update staff member details including role assignment"""
    db = get_db()
    coll = db.get_collection('staff')
    update = {}
    
    if payload.name is not None:
        update['name'] = payload.name
    if payload.role is not None:
        update['role'] = payload.role.value
    if payload.phone is not None:
        update['phone'] = payload.phone
    if payload.shift is not None:
        update['shift'] = payload.shift.value
    if payload.department is not None:
        update['department'] = payload.department
    if payload.salary is not None:
        update['salary'] = payload.salary
    if payload.active is not None:
        update['active'] = payload.active
    if payload.password is not None:
        update['password_hash'] = hash_password(payload.password)
    
    if not update:
        raise HTTPException(status_code=400, detail='No update fields provided')
    
    update['updatedAt'] = datetime.utcnow().isoformat()
    res = await coll.update_one({'_id': to_object_id(id)}, {'$set': update})
    
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail='Not found')
    
    updated = await coll.find_one({'_id': to_object_id(id)})
    updated.pop('password_hash', None)
    
    await log_audit(
        action='update_staff',
        resource='staff',
        resourceId=id,
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        details={'updated_fields': list(update.keys())},
        ip=request.client.host if request.client else None
    )
    return serialize_doc(updated)


@router.delete('/{id}', tags=['staff'])
async def delete_staff(id: str, request: Request):
    """Delete a staff member"""
    db = get_db()
    coll = db.get_collection('staff')
    res = await coll.delete_one({'_id': to_object_id(id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Not found')
    
    await log_audit(
        action='delete_staff',
        resource='staff',
        resourceId=id,
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        ip=request.client.host if request.client else None
    )
    return {'success': True}


# ============ STAFF ACTIVATION/DEACTIVATION ============
@router.post('/{id}/activate', tags=['staff'])
async def activate_staff(id: str, request: Request):
    """Activate a staff member"""
    db = get_db()
    coll = db.get_collection('staff')
    res = await coll.update_one({'_id': to_object_id(id)}, {'$set': {'active': True, 'updatedAt': datetime.utcnow().isoformat()}})
    
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail='Not found')
    
    await log_audit(
        action='activate_staff',
        resource='staff',
        resourceId=id,
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        ip=request.client.host if request.client else None
    )
    return {'success': True, 'message': 'Staff activated successfully'}


@router.post('/{id}/deactivate', tags=['staff'])
async def deactivate_staff(id: str, request: Request):
    """Deactivate a staff member"""
    db = get_db()
    coll = db.get_collection('staff')
    res = await coll.update_one({'_id': to_object_id(id)}, {'$set': {'active': False, 'updatedAt': datetime.utcnow().isoformat()}})
    
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail='Not found')
    
    await log_audit(
        action='deactivate_staff',
        resource='staff',
        resourceId=id,
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        ip=request.client.host if request.client else None
    )
    return {'success': True, 'message': 'Staff deactivated successfully'}


# ============ SHIFT MANAGEMENT ============
@router.get('/shifts/all', tags=['shifts'])
async def list_shifts(
    staffId: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """List shift assignments with optional filters"""
    db = get_db()
    coll = db.get_collection('shifts')
    filt = {}
    if staffId:
        filt['staffId'] = staffId
    if date_from:
        filt['date'] = {'$gte': date_from}
    if date_to:
        if 'date' in filt:
            filt['date']['$lte'] = date_to
        else:
            filt['date'] = {'$lte': date_to}
    
    docs = await coll.find(filt).sort('date', -1).to_list(1000)
    return serialize_doc(docs)


@router.post('/shifts', tags=['shifts'])
async def create_shift(payload: ShiftAssignment, request: Request):
    """Assign a shift to a staff member"""
    db = get_db()
    coll = db.get_collection('shifts')
    
    # Check if staff exists
    staff_coll = db.get_collection('staff')
    staff = await staff_coll.find_one({'_id': to_object_id(payload.staffId)})
    if not staff:
        raise HTTPException(status_code=404, detail='Staff not found')
    
    doc = {
        'staffId': payload.staffId,
        'staffName': staff.get('name'),
        'shiftType': payload.shiftType.value,
        'date': payload.date.isoformat(),
        'startTime': payload.startTime,
        'endTime': payload.endTime,
        'notes': payload.notes,
        'createdAt': datetime.utcnow().isoformat()
    }
    res = await coll.insert_one(doc)
    created = await coll.find_one({'_id': res.inserted_id})
    
    await log_audit(
        action='create_shift',
        resource='shift',
        resourceId=str(res.inserted_id),
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        details={'staffId': payload.staffId, 'date': payload.date.isoformat()},
        ip=request.client.host if request.client else None
    )
    return serialize_doc(created)


@router.delete('/shifts/{id}', tags=['shifts'])
async def delete_shift(id: str, request: Request):
    """Delete a shift assignment"""
    db = get_db()
    coll = db.get_collection('shifts')
    res = await coll.delete_one({'_id': to_object_id(id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Not found')
    
    await log_audit(
        action='delete_shift',
        resource='shift',
        resourceId=id,
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        ip=request.client.host if request.client else None
    )
    return {'success': True}


# ============ ATTENDANCE MANAGEMENT ============
@router.get('/attendance/all', tags=['attendance'])
async def list_attendance(
    staffId: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None
):
    """List attendance records with optional filters"""
    db = get_db()
    coll = db.get_collection('attendance')
    filt = {}
    if staffId:
        filt['staffId'] = staffId
    if date_from:
        filt['date'] = {'$gte': date_from}
    if date_to:
        if 'date' in filt:
            filt['date']['$lte'] = date_to
        else:
            filt['date'] = {'$lte': date_to}
    if status:
        filt['status'] = status
    
    docs = await coll.find(filt).sort('date', -1).to_list(1000)
    return serialize_doc(docs)


@router.post('/attendance', tags=['attendance'])
async def record_attendance(payload: AttendanceIn, request: Request):
    """Record attendance for a staff member"""
    db = get_db()
    coll = db.get_collection('attendance')
    
    # Check if staff exists
    staff_coll = db.get_collection('staff')
    staff = await staff_coll.find_one({'_id': to_object_id(payload.staffId)})
    if not staff:
        raise HTTPException(status_code=404, detail='Staff not found')
    
    # Check for duplicate attendance on same date
    existing = await coll.find_one({'staffId': payload.staffId, 'date': payload.date.isoformat()})
    if existing:
        # Update existing record
        update_data = {
            'status': payload.status.value,
            'checkIn': payload.checkIn,
            'checkOut': payload.checkOut,
            'hoursWorked': payload.hoursWorked,
            'notes': payload.notes,
            'updatedAt': datetime.utcnow().isoformat()
        }
        await coll.update_one({'_id': existing['_id']}, {'$set': update_data})
        updated = await coll.find_one({'_id': existing['_id']})
        return serialize_doc(updated)
    
    doc = {
        'staffId': payload.staffId,
        'staffName': staff.get('name'),
        'date': payload.date.isoformat(),
        'status': payload.status.value,
        'checkIn': payload.checkIn,
        'checkOut': payload.checkOut,
        'hoursWorked': payload.hoursWorked,
        'notes': payload.notes,
        'createdAt': datetime.utcnow().isoformat()
    }
    res = await coll.insert_one(doc)
    created = await coll.find_one({'_id': res.inserted_id})
    
    await log_audit(
        action='record_attendance',
        resource='attendance',
        resourceId=str(res.inserted_id),
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        details={'staffId': payload.staffId, 'date': payload.date.isoformat(), 'status': payload.status.value},
        ip=request.client.host if request.client else None
    )
    return serialize_doc(created)


@router.get('/attendance/summary', tags=['attendance'])
async def get_attendance_summary(
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Get attendance summary for all staff"""
    db = get_db()
    coll = db.get_collection('attendance')
    
    # Build date filter
    if month and year:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
    else:
        # Current month
        now = datetime.utcnow()
        start_date = f"{now.year}-{now.month:02d}-01"
        if now.month == 12:
            end_date = f"{now.year + 1}-01-01"
        else:
            end_date = f"{now.year}-{now.month + 1:02d}-01"
    
    pipeline = [
        {'$match': {'date': {'$gte': start_date, '$lt': end_date}}},
        {'$group': {
            '_id': {'staffId': '$staffId', 'status': '$status'},
            'count': {'$sum': 1}
        }},
        {'$group': {
            '_id': '$_id.staffId',
            'statuses': {'$push': {'status': '$_id.status', 'count': '$count'}}
        }}
    ]
    result = await coll.aggregate(pipeline).to_list(1000)
    return serialize_doc(result)


# ============ PERFORMANCE LOGGING ============
@router.get('/performance/all', tags=['performance'])
async def list_performance_logs(
    staffId: Optional[str] = None,
    metric: Optional[str] = None,
    period: Optional[str] = None
):
    """List performance logs with optional filters"""
    db = get_db()
    coll = db.get_collection('performance_logs')
    filt = {}
    if staffId:
        filt['staffId'] = staffId
    if metric:
        filt['metric'] = metric
    if period:
        filt['period'] = period
    
    docs = await coll.find(filt).sort('createdAt', -1).to_list(1000)
    return serialize_doc(docs)


@router.post('/performance', tags=['performance'])
async def log_performance(payload: PerformanceLogIn, request: Request):
    """Log performance metrics for a staff member"""
    db = get_db()
    coll = db.get_collection('performance_logs')
    
    # Check if staff exists
    staff_coll = db.get_collection('staff')
    staff = await staff_coll.find_one({'_id': to_object_id(payload.staffId)})
    if not staff:
        raise HTTPException(status_code=404, detail='Staff not found')
    
    doc = {
        'staffId': payload.staffId,
        'staffName': staff.get('name'),
        'metric': payload.metric,
        'value': payload.value,
        'period': payload.period,
        'notes': payload.notes,
        'createdAt': datetime.utcnow().isoformat()
    }
    res = await coll.insert_one(doc)
    created = await coll.find_one({'_id': res.inserted_id})
    
    await log_audit(
        action='log_performance',
        resource='performance',
        resourceId=str(res.inserted_id),
        userId=request.headers.get('x-user-id'),
        userName=request.headers.get('x-user-name'),
        details={'staffId': payload.staffId, 'metric': payload.metric, 'value': payload.value},
        ip=request.client.host if request.client else None
    )
    return serialize_doc(created)


@router.get('/performance/summary/{staffId}', tags=['performance'])
async def get_staff_performance_summary(staffId: str):
    """Get performance summary for a specific staff member"""
    db = get_db()
    coll = db.get_collection('performance_logs')
    
    pipeline = [
        {'$match': {'staffId': staffId}},
        {'$group': {
            '_id': '$metric',
            'avgValue': {'$avg': '$value'},
            'maxValue': {'$max': '$value'},
            'minValue': {'$min': '$value'},
            'count': {'$sum': 1}
        }}
    ]
    result = await coll.aggregate(pipeline).to_list(100)
    
    # Get recent logs
    recent_logs = await coll.find({'staffId': staffId}).sort('createdAt', -1).limit(10).to_list(10)
    
    return {
        'summary': serialize_doc(result),
        'recentLogs': serialize_doc(recent_logs)
    }


# ============ EXPORT ENDPOINTS ============
@router.get('/export/csv', tags=['export'])
async def export_staff_csv(
    role: Optional[str] = None,
    active: Optional[bool] = None,
    shift: Optional[str] = None
):
    """Export staff records as CSV"""
    db = get_db()
    coll = db.get_collection('staff')
    filt = {}
    if role:
        # Case-insensitive role filter using regex
        filt['role'] = {'$regex': f'^{role}$', '$options': 'i'}
    if active is not None:
        filt['active'] = active
    if shift:
        filt['shift'] = shift
    
    docs = await coll.find(filt, {'password_hash': 0}).to_list(1000)
    staff_list = serialize_doc(docs)
    
    # Generate CSV content
    csv_lines = ["ID,Name,Email,Role,Phone,Shift,Department,Salary,Hire Date,Status"]
    for s in staff_list:
        hire_date = s.get('hireDate', '')
        status = 'Active' if s.get('active', True) else 'Inactive'
        csv_lines.append(f"{s.get('_id','')},{s.get('name','')},{s.get('email','')},{s.get('role','')},{s.get('phone','')},{s.get('shift','')},{s.get('department','')},{s.get('salary','')},{hire_date},{status}")
    
    return {"csv": "\n".join(csv_lines), "filename": "staff_export.csv"}


@router.get('/attendance/export/csv', tags=['export'])
async def export_attendance_csv(
    staffId: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None
):
    """Export attendance records as CSV"""
    db = get_db()
    coll = db.get_collection('attendance')
    filt = {}
    if staffId:
        filt['staffId'] = staffId
    if date_from:
        filt['date'] = {'$gte': date_from}
    if date_to:
        if 'date' in filt:
            filt['date']['$lte'] = date_to
        else:
            filt['date'] = {'$lte': date_to}
    if status:
        filt['status'] = status
    
    docs = await coll.find(filt).sort('date', -1).to_list(1000)
    attendance_list = serialize_doc(docs)
    
    # Generate CSV content
    csv_lines = ["ID,Staff ID,Staff Name,Date,Status,Check In,Check Out,Hours Worked,Notes"]
    for a in attendance_list:
        csv_lines.append(f"{a.get('_id','')},{a.get('staffId','')},{a.get('staffName','')},{a.get('date','')},{a.get('status','')},{a.get('checkIn','')},{a.get('checkOut','')},{a.get('hoursWorked','')},{a.get('notes','')}")
    
    return {"csv": "\n".join(csv_lines), "filename": "attendance_export.csv"}


@router.get('/shifts/export/csv', tags=['export'])
async def export_shifts_csv(
    staffId: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Export shift assignments as CSV"""
    db = get_db()
    coll = db.get_collection('shifts')
    filt = {}
    if staffId:
        filt['staffId'] = staffId
    if date_from:
        filt['date'] = {'$gte': date_from}
    if date_to:
        if 'date' in filt:
            filt['date']['$lte'] = date_to
        else:
            filt['date'] = {'$lte': date_to}
    
    docs = await coll.find(filt).sort('date', -1).to_list(1000)
    shifts_list = serialize_doc(docs)
    
    # Generate CSV content
    csv_lines = ["ID,Staff ID,Staff Name,Date,Shift Type,Start Time,End Time,Notes"]
    for s in shifts_list:
        csv_lines.append(f"{s.get('_id','')},{s.get('staffId','')},{s.get('staffName','')},{s.get('date','')},{s.get('shiftType','')},{s.get('startTime','')},{s.get('endTime','')},{s.get('notes','')}")
    
    return {"csv": "\n".join(csv_lines), "filename": "shifts_export.csv"}


@router.get('/payroll/export/csv', tags=['export'])
async def export_payroll_csv(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Export payroll report as CSV"""
    db = get_db()
    
    # Get all staff
    staff_coll = db.get_collection('staff')
    all_staff = await staff_coll.find({}, {'password_hash': 0}).to_list(1000)
    
    # Get attendance records for the period
    attendance_coll = db.get_collection('attendance')
    att_filt = {}
    if date_from:
        att_filt['date'] = {'$gte': date_from}
    if date_to:
        if 'date' in att_filt:
            att_filt['date']['$lte'] = date_to
        else:
            att_filt['date'] = {'$lte': date_to}
    
    attendance_records = await attendance_coll.find(att_filt).to_list(10000)
    
    # Group attendance by staff
    attendance_by_staff = {}
    for att in attendance_records:
        sid = att.get('staffId')
        if sid not in attendance_by_staff:
            attendance_by_staff[sid] = []
        attendance_by_staff[sid].append(att)
    
    # Get shifts for overtime calculation
    shifts_coll = db.get_collection('shifts')
    shift_filt = {}
    if date_from:
        shift_filt['date'] = {'$gte': date_from}
    if date_to:
        if 'date' in shift_filt:
            shift_filt['date']['$lte'] = date_to
        else:
            shift_filt['date'] = {'$lte': date_to}
    
    shifts = await shifts_coll.find(shift_filt).to_list(10000)
    
    # Group shifts by staff
    shifts_by_staff = {}
    for shift in shifts:
        sid = shift.get('staffId')
        if sid not in shifts_by_staff:
            shifts_by_staff[sid] = []
        shifts_by_staff[sid].append(shift)
    
    # Generate CSV content
    csv_lines = ["Staff ID,Name,Role,Department,Salary,Days Present,Days Absent,Days Late,Total Hours,Regular Hours,Overtime Hours,Overtime Pay,Total Pay"]
    
    for staff in all_staff:
        sid = str(staff.get('_id', ''))
        att_records = attendance_by_staff.get(sid, [])
        shift_records = shifts_by_staff.get(sid, [])
        
        # Calculate stats
        days_present = len([a for a in att_records if a.get('status') == 'present'])
        days_absent = len([a for a in att_records if a.get('status') == 'absent'])
        days_late = len([a for a in att_records if a.get('status') == 'late'])
        
        # Calculate hours
        total_hours = sum([s.get('hoursWorked', 8) for s in shift_records])
        regular_hours = min(total_hours, 160)  # Assuming 8 hours/day * 20 days
        overtime_hours = max(0, total_hours - 160)
        
        # Calculate pay
        monthly_salary = staff.get('salary', 30000)
        hourly_rate = monthly_salary / 176  # 22 days * 8 hours
        overtime_pay = overtime_hours * hourly_rate * 1.5
        total_pay = monthly_salary + overtime_pay
        
        csv_lines.append(f"{sid},{staff.get('name','')},{staff.get('role','')},{staff.get('department','')},{monthly_salary},{days_present},{days_absent},{days_late},{total_hours:.1f},{regular_hours:.1f},{overtime_hours:.1f},{overtime_pay:.2f},{total_pay:.2f}")
    
    return {"csv": "\n".join(csv_lines), "filename": "payroll_export.csv"}

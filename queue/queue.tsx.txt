import { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  Users,
  CheckCircle,
  Bell,
  Shield,
  Coffee,
  ArrowRight,
  Home as HomeIcon,
  ChevronDown,
  Calendar,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  TimerOff,
  Plus,
  List,
  X,
  RefreshCcw,
} from "lucide-react";
import {
  joinQueue,
  fetchQueueEntries,
  cancelQueueEntry,
  updateQueueEntry,
  checkSlotAvailability,
  createReservation,
  pollQueueStatus,
} from "@/api/queue";
import type { QueueEntry } from "@/api/queue";

interface QueueProps {
  queueNumber: number | null;
  onJoinQueue: (number: number) => void;
  onNavigateToReservation?: (reservationData: any) => void;
  fromReservation?: boolean;
  reservationData?: {
    guests: number;
    queueDate: string;
    timeSlot: string;
    hall: "AC Hall" | "Main Hall" | "VIP Hall" | "Any";
    segment: "Front" | "Middle" | "Back" | "Any";
  };
  user: { email: string; name: string };
}

const TIME_SLOTS = [
  { value: "07:30-08:50", display: "7:30 AM - 8:50 AM" },
  { value: "09:10-10:30", display: "9:10 AM - 10:30 AM" },
  { value: "12:00-13:20", display: "12:00 PM - 1:20 PM" },
  { value: "13:40-15:00", display: "1:40 PM - 3:00 PM" },
  { value: "18:40-20:00", display: "6:40 PM - 8:00 PM" },
  { value: "20:20-21:40", display: "8:20 PM - 9:40 PM" },
];

const mapHallToBackend = (hall: string): string => {
  const mapping: Record<string, string> = {
    "AC Hall": "AC",
    "Main Hall": "Main",
    "VIP Hall": "VIP",
    Any: "Any",
  };
  return mapping[hall] || hall;
};

const mapHallFromBackend = (
  hall: string
): "AC Hall" | "Main Hall" | "VIP Hall" | "Any" => {
  const mapping: Record<string, "AC Hall" | "Main Hall" | "VIP Hall" | "Any"> =
    {
      AC: "AC Hall",
      Main: "Main Hall",
      VIP: "VIP Hall",
      Any: "Any",
    };
  return mapping[hall] || "Any";
};

export default function Queue({
  queueNumber,
  onJoinQueue,
  onNavigateToReservation,
  fromReservation = false,
  reservationData,
  user,
}: QueueProps) {
  const [showForm, setShowForm] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [guestsDropdownOpen, setGuestsDropdownOpen] = useState(false);
  const [hallDropdownOpen, setHallDropdownOpen] = useState(false);
  const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [availabilityDialogTimeout, setAvailabilityDialogTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [availabilityReason, setAvailabilityReason] = useState<
    "cancellation" | "scheduled" | "immediate"
  >("scheduled");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const [slotExpired, setSlotExpired] = useState(false);
  const [showRejoinOption, setShowRejoinOption] = useState(false);

  const [show15MinNoTableDialog, setShow15MinNoTableDialog] = useState(false);
  const [showSlotStartedDialog, setShowSlotStartedDialog] = useState(false);
  const [showSlotExpiredDialog, setShowSlotExpiredDialog] = useState(false);
  const slotStartedDialogShownRef = useRef(false);
  const slotExpiredDialogShownRef = useRef(false);

  const [showJoinAnotherForm, setShowJoinAnotherForm] = useState(false);
  const [showMyQueues, setShowMyQueues] = useState(false);
  const [allUserQueues, setAllUserQueues] = useState<QueueEntry[]>([]);
  const joinAnotherRef = useRef<HTMLDivElement>(null);
  const myQueuesRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    name: user.name || "",
    guests: reservationData?.guests.toString() || "2",
    queueDate:
      reservationData?.queueDate || new Date().toISOString().split("T")[0],
    notificationMethod: "sms" as "sms" | "email",
    contact: "",
    hall: (reservationData?.hall || "Any") as
      | "AC Hall"
      | "Main Hall"
      | "VIP Hall"
      | "Any",
    segment: (reservationData?.segment || "Any") as
      | "Front"
      | "Middle"
      | "Back"
      | "Any",
    timeSlot: reservationData?.timeSlot || "07:30-08:50",
  });

  const [anotherFormData, setAnotherFormData] = useState({
    name: user.name || "",
    guests: "2",
    queueDate: new Date().toISOString().split("T")[0],
    notificationMethod: "sms" as "sms" | "email",
    contact: "",
    hall: "Any" as "AC Hall" | "Main Hall" | "VIP Hall" | "Any",
    segment: "Any" as "Front" | "Middle" | "Back" | "Any",
    timeSlot: "07:30-08:50",
  });
  const [anotherCalendar, setAnotherCalendar] = useState(false);
  const [anotherMonth, setAnotherMonth] = useState(new Date());
  const [anotherGuestsOpen, setAnotherGuestsOpen] = useState(false);
  const [anotherHallOpen, setAnotherHallOpen] = useState(false);
  const [anotherSegmentOpen, setAnotherSegmentOpen] = useState(false);

  const [queueDatabase, setQueueDatabase] = useState<QueueEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<QueueEntry | null>(
    null
  );

  // ─── Slot time helpers ───────────────────────────────────────────────────────

  const isSlotStarted = (dateString: string, timeSlot: string): boolean => {
    const [startTime] = timeSlot.split("-");
    const [hours, minutes] = startTime.split(":").map(Number);
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0) < new Date();
  };

  const isSlotEnded = (dateString: string, timeSlot: string): boolean => {
    const [, endTime] = timeSlot.split("-");
    const [hours, minutes] = endTime.split(":").map(Number);
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0) < new Date();
  };

  const calculateTimeUntilSlot = (
    queueDate: string,
    timeSlot: string
  ): number => {
    const [startHour, startMinute] = timeSlot
      .split("-")[0]
      .split(":")
      .map(Number);
    const [year, month, day] = queueDate.split("-").map(Number);
    const slotDate = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    return Math.max(0, (slotDate.getTime() - Date.now()) / (1000 * 60));
  };

  const getAvailableTimeSlots = (dateString: string) => {
    const selectedDate = new Date(dateString + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return TIME_SLOTS;
    return TIME_SLOTS.filter(
      (slot) => !isSlotStarted(dateString, slot.value)
    );
  };

  const checkSlotState = (entry: QueueEntry) => {
    if (isSlotEnded(entry.queueDate, entry.timeSlot)) {
      setSlotExpired(true);
      setShowRejoinOption(false);
    } else if (
      isSlotStarted(entry.queueDate, entry.timeSlot) &&
      !entry.tableAvailable
    ) {
      setShowRejoinOption(true);
      setSlotExpired(false);
    } else {
      setSlotExpired(false);
      setShowRejoinOption(false);
    }
  };

  // ─── Reset to clean join-form state ─────────────────────────────────────────
  const resetToJoinForm = useCallback(() => {
    setAllUserQueues([]);
    setCurrentUserEntry(null);
    setShowStatus(false);
    setShowForm(false);
    setShowMyQueues(false);
    setShowJoinAnotherForm(false);
    setSlotExpired(false);
    setShowRejoinOption(false);
    slotStartedDialogShownRef.current = false;
    slotExpiredDialogShownRef.current = false;
    setShow15MinNoTableDialog(false);
    setShowSlotStartedDialog(false);
    setShowSlotExpiredDialog(false);
    setFormData({
      name: user.name || "",
      guests: "2",
      queueDate: new Date().toISOString().split("T")[0],
      notificationMethod: "sms",
      contact: "",
      hall: "Any",
      segment: "Any",
      timeSlot: "07:30-08:50",
    });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  }, [user.name]);

  // ─── Core fetch function (reusable) ─────────────────────────────────────────
  const loadQueueData = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true);
      try {
        const entries = await fetchQueueEntries(undefined, user.email);
        const mappedEntries = entries.map((entry) => ({
          ...entry,
          hall: mapHallFromBackend(entry.hall),
        }));
        setQueueDatabase(mappedEntries);
        const userQueues = mappedEntries.filter((e) => e.userId === user.email);
        setAllUserQueues(userQueues);

        setCurrentUserEntry((prev) => {
          if (prev) {
            const refreshed = userQueues.find((e) => e.id === prev.id);
            if (refreshed) return refreshed;
            return userQueues[0] || null;
          }
          return userQueues[0] || null;
        });

        if (userQueues.length > 0) {
          setShowStatus(true);
          setShowForm(true);
          checkSlotState(userQueues[0]);
        }
        setLastRefreshed(new Date());
      } catch (error) {
        console.error("Failed to load queue:", error);
      } finally {
        if (!silent) setIsRefreshing(false);
      }
    },
    [user.email]
  );

  // Load on mount
  useEffect(() => {
    loadQueueData(true);
  }, [loadQueueData]);

  useEffect(() => {
    if (fromReservation) {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [fromReservation]);

  const isSlotReserved = async (
    dateString: string,
    timeSlot: string,
    guests: number,
    hall: string,
    segment: string,
    excludeUserId?: string
  ): Promise<boolean> => {
    try {
      const hallMapped = mapHallToBackend(hall);
      const result = await checkSlotAvailability({
        queueDate: dateString,
        timeSlot,
        guests,
        hall: hallMapped,
        segment,
        excludeUserId,
      });
      return result.isReserved;
    } catch (error) {
      console.error("Failed to check slot availability:", error);
      return false;
    }
  };

  useEffect(() => {
    const availableSlots = getAvailableTimeSlots(formData.queueDate);
    if (
      availableSlots.length > 0 &&
      isSlotStarted(formData.queueDate, formData.timeSlot)
    ) {
      setFormData((prev) => ({ ...prev, timeSlot: availableSlots[0].value }));
    }
  }, [formData.queueDate]);

  useEffect(() => {
    const availableSlots = getAvailableTimeSlots(anotherFormData.queueDate);
    if (
      availableSlots.length > 0 &&
      isSlotStarted(anotherFormData.queueDate, anotherFormData.timeSlot)
    ) {
      setAnotherFormData((prev) => ({
        ...prev,
        timeSlot: availableSlots[0].value,
      }));
    }
  }, [anotherFormData.queueDate]);

  // ─── Trigger availability dialog ─────────────────────────────────────────────
  const triggerAvailabilityDialog = async (
    reason: "cancellation" | "immediate",
    entry: QueueEntry
  ) => {
    setAvailabilityReason(reason);
    setShowAvailabilityDialog(true);
    setCountdownSeconds(180);

    const timeout = setTimeout(
      () => handleSkipToNextCustomer(),
      3 * 60 * 1000
    );
    setAvailabilityDialogTimeout(timeout);

    try {
      const updated = await updateQueueEntry(entry.id, {
        notifiedAt15Min: true,
        tableAvailable: true,
        notificationExpiresAt: new Date(Date.now() + 3 * 60 * 1000),
      });
      setCurrentUserEntry({ ...updated, hall: mapHallFromBackend(updated.hall) });
    } catch (error) {
      console.error("Failed to update queue entry:", error);
    }
  };

  // ─── Poll backend every 5s ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserEntry || showAvailabilityDialog || slotExpired) return;

    const cancellationPoller = setInterval(async () => {
      if (showAvailabilityDialog) return;
      if (isSlotEnded(currentUserEntry.queueDate, currentUserEntry.timeSlot)) {
        setSlotExpired(true);
        return;
      }

      try {
        const pollResult = await pollQueueStatus(user.email);

        if (!pollResult.entry) {
          await loadQueueData(true);
          return;
        }

        if (
          pollResult.tableAvailable &&
          !pollResult.autoExpired &&
          !currentUserEntry.tableAvailable
        ) {
          const reason = pollResult.fromReservationCancellation
            ? "cancellation"
            : "immediate";
          const freshEntry = {
            ...pollResult.entry,
            hall: mapHallFromBackend(pollResult.entry.hall),
          };
          setCurrentUserEntry(freshEntry);
          triggerAvailabilityDialog(reason, freshEntry);
          return;
        }

        if (pollResult.autoExpired) {
          await loadQueueData(true);
          return;
        }

        const freshEntry = {
          ...pollResult.entry,
          hall: mapHallFromBackend(pollResult.entry.hall),
        };
        setCurrentUserEntry((prev) => {
          if (!prev) return freshEntry;
          if (
            prev.position !== freshEntry.position ||
            prev.estimatedWaitMinutes !== freshEntry.estimatedWaitMinutes ||
            prev.tableAvailable !== freshEntry.tableAvailable
          ) {
            return freshEntry;
          }
          return prev;
        });
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 5000);

    return () => clearInterval(cancellationPoller);
  }, [currentUserEntry, showAvailabilityDialog, slotExpired, user.email]);

  // ─── Monitor 15-min window + slot start + slot expiry ────────────────────────
  useEffect(() => {
    if (!currentUserEntry) return;

    const interval = setInterval(async () => {
      const minutesUntilSlot = calculateTimeUntilSlot(
        currentUserEntry.queueDate,
        currentUserEntry.timeSlot
      );

      if (isSlotEnded(currentUserEntry.queueDate, currentUserEntry.timeSlot)) {
        setSlotExpired(true);
        setShowRejoinOption(false);
        if (
          !slotExpiredDialogShownRef.current &&
          !currentUserEntry.tableAvailable
        ) {
          slotExpiredDialogShownRef.current = true;
          setShowSlotExpiredDialog(true);
        }
        return;
      }

      if (
        isSlotStarted(currentUserEntry.queueDate, currentUserEntry.timeSlot) &&
        !currentUserEntry.tableAvailable
      ) {
        setShowRejoinOption(true);
        if (!slotStartedDialogShownRef.current) {
          slotStartedDialogShownRef.current = true;
          setShowSlotStartedDialog(true);
        }
      }

      if (
        minutesUntilSlot <= 15 &&
        minutesUntilSlot > 0 &&
        !currentUserEntry.notifiedAt15Min &&
        !currentUserEntry.tableAvailable &&
        !showAvailabilityDialog &&
        !show15MinNoTableDialog
      ) {
        const reserved = await isSlotReserved(
          currentUserEntry.queueDate,
          currentUserEntry.timeSlot,
          currentUserEntry.guests,
          currentUserEntry.hall,
          currentUserEntry.segment,
          user.email
        );
        if (!reserved) {
          triggerAvailabilityDialog("immediate", currentUserEntry);
        } else {
          setShow15MinNoTableDialog(true);
          try {
            await updateQueueEntry(currentUserEntry.id, {
              notifiedAt15Min: true,
            });
            setCurrentUserEntry((prev) =>
              prev ? { ...prev, notifiedAt15Min: true } : null
            );
          } catch (e) {
            console.error("Failed to mark 15-min notification:", e);
          }
        }
      }

      setCurrentUserEntry((prev) =>
        prev ? { ...prev, estimatedWaitMinutes: minutesUntilSlot } : null
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUserEntry, showAvailabilityDialog, show15MinNoTableDialog]);

  // Availability countdown
  useEffect(() => {
    if (showAvailabilityDialog && countdownSeconds > 0) {
      const timer = setTimeout(
        () => setCountdownSeconds((s) => s - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [showAvailabilityDialog, countdownSeconds]);

  useEffect(() => {
    return () => {
      if (availabilityDialogTimeout)
        clearTimeout(availabilityDialogTimeout);
    };
  }, [availabilityDialogTimeout]);

  // ─── Refresh handler ─────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const entries = await fetchQueueEntries(undefined, user.email);
      const mappedEntries = entries.map((entry) => ({
        ...entry,
        hall: mapHallFromBackend(entry.hall),
      }));
      setQueueDatabase(mappedEntries);
      const userQueues = mappedEntries.filter((e) => e.userId === user.email);
      setAllUserQueues(userQueues);

      if (userQueues.length === 0) {
        // No queues found on refresh → go to join form
        resetToJoinForm();
      } else {
        setCurrentUserEntry((prev) => {
          if (prev) {
            const refreshed = userQueues.find((e) => e.id === prev.id);
            if (refreshed) return refreshed;
            return userQueues[0] || null;
          }
          return userQueues[0] || null;
        });
        setShowStatus(true);
        setShowForm(true);
        checkSlotState(userQueues[0]);
      }
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to refresh queue:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ─── Confirm table ───────────────────────────────────────────────────────────
  const handleConfirmTable = async () => {
    if (availabilityDialogTimeout) clearTimeout(availabilityDialogTimeout);
    setShowAvailabilityDialog(false);
    if (!currentUserEntry) return;

    try {
      await createReservation({
        name: currentUserEntry.name,
        contact: currentUserEntry.contact,
        guests: currentUserEntry.guests,
        hall: mapHallToBackend(currentUserEntry.hall),
        segment: currentUserEntry.segment,
        queueDate: currentUserEntry.queueDate,
        timeSlot: currentUserEntry.timeSlot,
        timeSlotDisplay: currentUserEntry.timeSlotDisplay,
        userId: user.email,
        reservedAt: new Date().toISOString(),
        fromQueue: true,
        status: "confirmed",
      });

      await updateQueueEntry(currentUserEntry.id, {
        tableAvailable: true,
        tableConfirmed: true,
        status: "confirmed",
      });

      await cancelQueueEntry(currentUserEntry.id);

      const resData = {
        name: currentUserEntry.name,
        contact: currentUserEntry.contact,
        guests: currentUserEntry.guests,
        hall: currentUserEntry.hall,
        segment: currentUserEntry.segment,
        queueDate: currentUserEntry.queueDate,
        timeSlot: currentUserEntry.timeSlot,
        timeSlotDisplay: currentUserEntry.timeSlotDisplay,
        fromQueue: true,
        availabilityReason,
        status: "confirmed",
      };
      localStorage.setItem("pendingReservation", JSON.stringify(resData));

      await loadQueueData(true);
      setCurrentUserEntry(null);
      setShowStatus(false);
      setShowForm(false);

      if (onNavigateToReservation) onNavigateToReservation(resData);
      else alert("✅ Table Confirmed! Redirecting to reservation page...");
    } catch (error: any) {
      alert(`Failed to confirm table: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeclineTable = async () => {
    if (availabilityDialogTimeout) clearTimeout(availabilityDialogTimeout);
    setShowAvailabilityDialog(false);
    if (!currentUserEntry) return;

    try {
      await cancelQueueEntry(currentUserEntry.id);
      await loadQueueData(true);
      setCurrentUserEntry(null);
      setShowStatus(false);
      setShowForm(false);
      setTimeout(() => {
        setShowStatus(true);
        setShowForm(true);
        setShowJoinAnotherForm(true);
        setTimeout(
          () =>
            joinAnotherRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          200
        );
      }, 100);
    } catch (error: any) {
      alert(`Failed to decline: ${error.message || "Unknown error"}`);
    }
  };

  const handleSkipToNextCustomer = async () => {
    setShowAvailabilityDialog(false);
    if (!currentUserEntry) return;

    try {
      await cancelQueueEntry(currentUserEntry.id);
      await loadQueueData(true);
      setCurrentUserEntry(null);
      setShowStatus(false);
      setShowForm(false);
      setTimeout(() => {
        setShowStatus(true);
        setShowForm(true);
        setShowJoinAnotherForm(true);
        setTimeout(
          () =>
            joinAnotherRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          200
        );
      }, 100);
    } catch (error: any) {
      console.error("Failed to skip to next customer:", error);
    }
  };

  const handleRejoinQueue = async () => {
    if (currentUserEntry) {
      try {
        await cancelQueueEntry(currentUserEntry.id);
      } catch (e) {
        console.error("Failed to cancel before rejoin:", e);
      }
    }
    setCurrentUserEntry(null);
    setShowStatus(false);
    setShowRejoinOption(false);
    setSlotExpired(false);
    slotStartedDialogShownRef.current = false;
    slotExpiredDialogShownRef.current = false;
    setShow15MinNoTableDialog(false);
    setShowSlotStartedDialog(false);
    setShowSlotExpiredDialog(false);
    setFormData((prev) => ({
      ...prev,
      queueDate: new Date().toISOString().split("T")[0],
      hall: "Any",
      segment: "Any",
    }));
    setShowForm(true);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100
    );
  };

  // ─── Join Another Queue ───────────────────────────────────────────────────────
  const handleJoinAnotherQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anotherFormData.name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!anotherFormData.contact.trim()) {
      alert("Please enter your contact details");
      return;
    }
    if (isSlotStarted(anotherFormData.queueDate, anotherFormData.timeSlot)) {
      alert("Please select a future date and time slot");
      return;
    }

    const guestsNum = parseInt(anotherFormData.guests);

    const reserved = await isSlotReserved(
      anotherFormData.queueDate,
      anotherFormData.timeSlot,
      guestsNum,
      anotherFormData.hall,
      anotherFormData.segment
    );

    if (!reserved) {
      if (
        confirm(
          `🎉 Great News!\n\nA table for ${guestsNum} guests in ${anotherFormData.hall} (${anotherFormData.segment} segment) is available now!\n\nWould you like to proceed with immediate reservation?`
        )
      ) {
        const immediateReservationData = {
          name: anotherFormData.name,
          contact: anotherFormData.contact,
          guests: guestsNum,
          hall: anotherFormData.hall,
          segment: anotherFormData.segment,
          queueDate: anotherFormData.queueDate,
          timeSlot: anotherFormData.timeSlot,
          timeSlotDisplay: TIME_SLOTS.find(
            (s) => s.value === anotherFormData.timeSlot
          )?.display,
          fromQueue: true,
          immediate: true,
        };
        try {
          await createReservation({
            ...immediateReservationData,
            hall: mapHallToBackend(anotherFormData.hall),
            userId: user.email,
            reservedAt: new Date().toISOString(),
            status: "confirmed",
          });
        } catch (err) {
          console.error("Failed to create immediate reservation:", err);
        }
        localStorage.setItem(
          "pendingReservation",
          JSON.stringify(immediateReservationData)
        );
        if (onNavigateToReservation)
          onNavigateToReservation(immediateReservationData);
        else
          alert(
            "✅ Table Reserved! Redirecting to complete your reservation..."
          );
        return;
      }
    }

    const timeSlotObj = TIME_SLOTS.find(
      (slot) => slot.value === anotherFormData.timeSlot
    );
    const timeSlotDisplay = timeSlotObj
      ? timeSlotObj.display
      : anotherFormData.timeSlot;

    try {
      const newEntry = await joinQueue({
        id: `QUEUE${Date.now()}`,
        userId: user.email,
        name: anotherFormData.name,
        guests: guestsNum,
        notificationMethod: anotherFormData.notificationMethod,
        contact: anotherFormData.contact,
        hall: mapHallToBackend(anotherFormData.hall),
        segment: anotherFormData.segment,
        queueDate: anotherFormData.queueDate,
        timeSlot: anotherFormData.timeSlot,
        timeSlotDisplay,
        notifiedAt15Min: false,
        tableAvailable: false,
        notificationExpiresAt: null,
        fromReservationCancellation: false,
      } as any);

      const mappedEntry = { ...newEntry, hall: mapHallFromBackend(newEntry.hall) };
      setQueueDatabase((prev) => [...prev, mappedEntry]);
      setAllUserQueues((prev) => [...prev, mappedEntry]);
      onJoinQueue(mappedEntry.position);
      setShowJoinAnotherForm(false);
      setShowMyQueues(true);
      setTimeout(
        () =>
          myQueuesRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100
      );
    } catch (error: any) {
      alert(`Failed to join queue: ${error.message || "Unknown error"}`);
    }
  };

  // ─── Cancel a specific queue entry ───────────────────────────────────────────
  const handleCancelSpecificQueue = async (entryId: string) => {
    if (!confirm("Are you sure you want to cancel this queue position?")) return;
    try {
      await cancelQueueEntry(entryId);

      // Compute remaining synchronously BEFORE any async state updates
      const remaining = allUserQueues.filter((e) => e.id !== entryId);

      if (remaining.length === 0) {
        // ── All queues cancelled → reset everything and show join form ──
        resetToJoinForm();
      } else {
        // ── Still have other queues → switch view if needed ──
        if (currentUserEntry?.id === entryId) {
          const nextEntry = remaining[0];
          setCurrentUserEntry(nextEntry);
          checkSlotState(nextEntry);
        }
        setAllUserQueues(remaining);
        // Sync from backend silently
        await loadQueueData(true);
      }
    } catch (error: any) {
      alert(`Failed to cancel queue: ${error.message || "Unknown error"}`);
    }
  };

  // ─── Main join queue form submit ─────────────────────────────────────────────
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!formData.contact.trim()) {
      alert("Please enter your contact details");
      return;
    }
    if (isSlotStarted(formData.queueDate, formData.timeSlot)) {
      alert("Please select a future date and time slot");
      return;
    }

    const guestsNum = parseInt(formData.guests);

    const reserved = await isSlotReserved(
      formData.queueDate,
      formData.timeSlot,
      guestsNum,
      formData.hall,
      formData.segment,
      user.email
    );

    if (!reserved) {
      if (
        confirm(
          `🎉 Great News!\n\nA table for ${guestsNum} guests in ${formData.hall} (${formData.segment} segment) is available now!\n\nWould you like to proceed with immediate reservation?`
        )
      ) {
        const immediateReservationData = {
          name: formData.name,
          contact: formData.contact,
          guests: guestsNum,
          hall: formData.hall,
          segment: formData.segment,
          queueDate: formData.queueDate,
          timeSlot: formData.timeSlot,
          timeSlotDisplay: TIME_SLOTS.find(
            (s) => s.value === formData.timeSlot
          )?.display,
          fromQueue: true,
          immediate: true,
        };
        try {
          await createReservation({
            ...immediateReservationData,
            hall: mapHallToBackend(formData.hall),
            userId: user.email,
            reservedAt: new Date().toISOString(),
            status: "confirmed",
          });
        } catch (err) {
          console.error("Failed to create immediate reservation:", err);
        }
        localStorage.setItem(
          "pendingReservation",
          JSON.stringify(immediateReservationData)
        );
        if (onNavigateToReservation)
          onNavigateToReservation(immediateReservationData);
        else
          alert(
            "✅ Table Reserved! Redirecting to complete your reservation..."
          );
        return;
      }
    }

    const timeSlotObj = TIME_SLOTS.find(
      (slot) => slot.value === formData.timeSlot
    );
    const timeSlotDisplay = timeSlotObj
      ? timeSlotObj.display
      : formData.timeSlot;

    try {
      const newEntry = await joinQueue({
        id: `QUEUE${Date.now()}`,
        userId: user.email,
        name: formData.name,
        guests: guestsNum,
        notificationMethod: formData.notificationMethod,
        contact: formData.contact,
        hall: mapHallToBackend(formData.hall),
        segment: formData.segment,
        queueDate: formData.queueDate,
        timeSlot: formData.timeSlot,
        timeSlotDisplay,
        notifiedAt15Min: false,
        tableAvailable: false,
        notificationExpiresAt: null,
        fromReservationCancellation: false,
      } as any);

      const mappedEntry = {
        ...newEntry,
        hall: mapHallFromBackend(newEntry.hall),
      };
      setQueueDatabase((prev) => [...prev, mappedEntry]);
      setAllUserQueues((prev) => [...prev, mappedEntry]);
      setCurrentUserEntry(mappedEntry);
      setSlotExpired(false);
      setShowRejoinOption(false);
      slotStartedDialogShownRef.current = false;
      slotExpiredDialogShownRef.current = false;
      onJoinQueue(mappedEntry.position);
      setShowStatus(true);
      setShowForm(true);
    } catch (error: any) {
      alert(`Failed to join queue: ${error.message || "Unknown error"}`);
    }
  };

  const handleCancelQueue = async () => {
    if (!currentUserEntry) return;
    if (!confirm("Are you sure you want to cancel your queue position?")) return;

    try {
      await cancelQueueEntry(currentUserEntry.id);
      const remaining = allUserQueues.filter((e) => e.id !== currentUserEntry.id);

      if (remaining.length === 0) {
        resetToJoinForm();
      } else {
        const nextEntry = remaining[0];
        setCurrentUserEntry(nextEntry);
        setAllUserQueues(remaining);
        checkSlotState(nextEntry);
        await loadQueueData(true);
      }
    } catch (error: any) {
      alert(`Failed to cancel queue: ${error.message || "Unknown error"}`);
    }
  };

  const handleViewStatus = () => {
    setShowStatus(true);
    setShowForm(true);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100
    );
  };

  const handleBackToHero = () => {
    setShowForm(false);
    setShowStatus(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Formatters ──────────────────────────────────────────────────────────────

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 1) return "Almost Ready!";
    if (minutes < 60) {
      const mins = Math.floor(minutes);
      const secs = Math.floor((minutes - mins) * 60);
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    const wholeHours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const remainingSeconds = Math.floor(
      ((minutes % 60) - remainingMinutes) * 60
    );
    return `${wholeHours}h ${String(remainingMinutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // ─── Calendar helpers ─────────────────────────────────────────────────────────

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
    };
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (isDateDisabled(selectedDate)) return;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(selectedDate.getDate()).padStart(2, "0");
    setFormData({ ...formData, queueDate: `${year}-${month}-${dayStr}` });
    setShowCalendar(false);
  };

  const handleAnotherDateSelect = (day: number) => {
    const selectedDate = new Date(
      anotherMonth.getFullYear(),
      anotherMonth.getMonth(),
      day
    );
    if (isDateDisabled(selectedDate)) return;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(selectedDate.getDate()).padStart(2, "0");
    setAnotherFormData({
      ...anotherFormData,
      queueDate: `${year}-${month}-${dayStr}`,
    });
    setAnotherCalendar(false);
  };

  const renderCalendarDays = (
    month: Date,
    selectedDate: string,
    onSelect: (day: number) => void
  ) => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(month);
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++)
      days.push(<div key={`empty-${i}`} className="p-2" />);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const disabled = isDateDisabled(date);
      const isSelected =
        selectedDate ===
        `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => onSelect(day)}
          disabled={disabled}
          className={`p-2 rounded-lg transition-all ${
            disabled
              ? "text-gray-300 cursor-not-allowed"
              : isSelected
              ? "bg-[#8B5A2B] text-white font-bold"
              : "hover:bg-[#E8DED0] text-[#3E2723]"
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset)
    );
  };
  const changeAnotherMonth = (offset: number) => {
    setAnotherMonth(
      new Date(anotherMonth.getFullYear(), anotherMonth.getMonth() + offset)
    );
  };

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const availableTimeSlots = getAvailableTimeSlots(formData.queueDate);
  const anotherAvailableTimeSlots = getAvailableTimeSlots(
    anotherFormData.queueDate
  );

  const getAvailabilityMessage = () => {
    if (availabilityReason === "cancellation")
      return "A reservation was just cancelled — act fast!";
    if (availabilityReason === "immediate")
      return "No reservation exists for this slot!";
    return "Reservation holder didn't respond!";
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1769773297747-bd00e31b33aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwZWxlZ2FudHxlbnwxfHx8fDE3NzAxMjIwNTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Fine Dining Restaurant"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3E2723]/70 via-[#3E2723]/50 to-[#3E2723]/70" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1
            className="text-5xl md:text-7xl mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            "Good food is always worth the wait."
          </h1>
          <p className="text-xl md:text-2xl text-[#EADBC8] mb-12">
            Relax. Your table will be prepared with care.
          </p>
          <button
            onClick={scrollToForm}
            className="group bg-[#8B5A2B] text-white px-10 py-4 rounded-lg hover:bg-[#6D4C41] transition-all shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
          >
            Join the Queue
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl text-center mb-4 text-[#8B5A2B]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            A Better Way to Wait
          </h2>
          <p className="text-center text-[#6D4C41] mb-16 text-lg">
            No standing. No confusion. Just comfort and trust.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Clock, title: "Live Queue Updates", desc: "Your position updates automatically in real-time" },
              { icon: Bell, title: "Smart Notifications", desc: "Instant alerts when tables become available" },
              { icon: Coffee, title: "Comfortable Waiting", desc: "No standing in line. Relax anywhere you like" },
              { icon: Shield, title: "Fair Queue System", desc: "First come, first served with priority for cancellations" },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={idx}
                className="bg-[#FAF7F2] rounded-2xl p-8 text-center hover:shadow-lg transition-shadow border border-[#E8DED0]"
              >
                <div className="w-16 h-16 bg-[#8B5A2B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 h-8 text-[#8B5A2B]" />
                </div>
                <h3
                  className="text-xl mb-3 text-[#3E2723]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {title}
                </h3>
                <p className="text-[#6D4C41]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form / Status Section */}
      <section ref={formRef} className="py-20 px-6 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto">
          {!showStatus ? (
            /* ── Join Queue Form ── */
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-[#E8DED0]">
              <div className="text-center mb-10">
                <h2
                  className="text-4xl mb-3 text-[#8B5A2B]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {fromReservation
                    ? "Complete Your Queue Registration"
                    : "Join Queue"}
                </h2>
                <p className="text-[#6D4C41] text-lg mb-6">
                  {fromReservation
                    ? "This slot is currently reserved. Please provide your contact details to join the queue."
                    : "Fine Dining Restaurant"}
                </p>
                {currentUserEntry && (
                  <button
                    onClick={handleViewStatus}
                    className="bg-[#8B5A2B]/10 text-[#8B5A2B] px-6 py-2 rounded-lg hover:bg-[#8B5A2B]/20 transition-colors"
                  >
                    View Your Status
                  </button>
                )}
              </div>

              <form onSubmit={handleJoinQueue} className="space-y-6">
                <div>
                  <label className="block text-[#3E2723] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#3E2723] mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white"
                    required
                  />
                </div>

                {!fromReservation && (
                  <>
                    {/* Guests */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">
                        Number of Guests
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setGuestsDropdownOpen(!guestsDropdownOpen)
                          }
                          className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left flex items-center justify-between"
                        >
                          <span>{formData.guests} guests</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              guestsDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {guestsDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E8DED0] rounded-lg shadow-lg z-10">
                            <div className="grid grid-cols-5 gap-3 p-2">
                              {["1","2","3","4","5","6","7","8","9","10"].map(
                                (num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, guests: num });
                                      setGuestsDropdownOpen(false);
                                    }}
                                    className={`py-3 rounded-lg border-2 transition-all ${
                                      formData.guests === num
                                        ? "border-[#8B5A2B] bg-[#8B5A2B] text-white"
                                        : "border-[#E8DED0] text-[#3E2723] hover:border-[#8B5A2B]"
                                    }`}
                                  >
                                    {num}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">
                        Queue Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B] pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="w-full pl-12 pr-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left"
                        >
                          {new Date(formData.queueDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </button>
                      </div>
                      {showCalendar && (
                        <div className="mt-3 p-4 border border-[#E8DED0] rounded-lg bg-white shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => changeMonth(-1)}
                              className="p-2 hover:bg-[#E8DED0] rounded-lg transition-colors"
                              disabled={
                                currentMonth.getMonth() ===
                                  new Date().getMonth() &&
                                currentMonth.getFullYear() ===
                                  new Date().getFullYear()
                              }
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-semibold text-[#3E2723]">
                              {monthNames[currentMonth.getMonth()]}{" "}
                              {currentMonth.getFullYear()}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeMonth(1)}
                              className="p-2 hover:bg-[#E8DED0] rounded-lg transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(
                              (day) => (
                                <div
                                  key={day}
                                  className="text-xs font-semibold text-[#6D4C41] p-2"
                                >
                                  {day}
                                </div>
                              )
                            )}
                            {renderCalendarDays(
                              currentMonth,
                              formData.queueDate,
                              handleDateSelect
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Time Slot */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">
                        Time Slot
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B] pointer-events-none" />
                        <select
                          value={formData.timeSlot}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeSlot: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white"
                          required
                        >
                          {availableTimeSlots.length === 0 ? (
                            <option value="">
                              No available slots for this date
                            </option>
                          ) : (
                            availableTimeSlots.map((slot) => (
                              <option key={slot.value} value={slot.value}>
                                {slot.display}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      {availableTimeSlots.length === 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          All time slots have passed. Please select a future date.
                        </p>
                      )}
                    </div>

                    {/* Hall */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">
                        Location Preference (Hall)
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setHallDropdownOpen(!hallDropdownOpen)}
                          className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left"
                        >
                          {formData.hall}
                          <ChevronDown className="w-4 h-4 ml-2 inline-block" />
                        </button>
                        {hallDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E8DED0] rounded-lg shadow-lg z-10">
                            <div className="grid grid-cols-4 gap-3 p-2">
                              {["AC Hall","Main Hall","VIP Hall","Any"].map(
                                (hall) => (
                                  <button
                                    key={hall}
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        hall: hall as any,
                                      });
                                      setHallDropdownOpen(false);
                                    }}
                                    className={`py-3 rounded-lg border-2 transition-all ${
                                      formData.hall === hall
                                        ? "border-[#8B5A2B] bg-[#8B5A2B] text-white"
                                        : "border-[#E8DED0] text-[#3E2723] hover:border-[#8B5A2B]"
                                    }`}
                                  >
                                    {hall}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Segment */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">
                        Segment Preference
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setSegmentDropdownOpen(!segmentDropdownOpen)
                          }
                          className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left"
                        >
                          {formData.segment}
                          <ChevronDown className="w-4 h-4 ml-2 inline-block" />
                        </button>
                        {segmentDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E8DED0] rounded-lg shadow-lg z-10">
                            <div className="grid grid-cols-4 gap-3 p-2">
                              {["Front","Middle","Back","Any"].map((segment) => (
                                <button
                                  key={segment}
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      segment: segment as any,
                                    });
                                    setSegmentDropdownOpen(false);
                                  }}
                                  className={`py-3 rounded-lg border-2 transition-all ${
                                    formData.segment === segment
                                      ? "border-[#8B5A2B] bg-[#8B5A2B] text-white"
                                      : "border-[#E8DED0] text-[#3E2723] hover:border-[#8B5A2B]"
                                  }`}
                                >
                                  {segment}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {fromReservation && reservationData && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Queue Details (from your reservation)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-blue-700">Guests:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {reservationData.guests}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Hall:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {reservationData.hall}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Date:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {new Date(reservationData.queueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Segment:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {reservationData.segment}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-blue-700">Time Slot:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {
                            TIME_SLOTS.find(
                              (s) => s.value === reservationData.timeSlot
                            )?.display
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    !fromReservation && availableTimeSlots.length === 0
                  }
                  className="w-full bg-[#8B5A2B] text-white py-4 rounded-lg hover:bg-[#6D4C41] transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {fromReservation
                    ? "Join Queue"
                    : "Check Availability & Join"}
                </button>
              </form>
            </div>
          ) : (
            /* ── Queue Status View ── */
            <div className="space-y-6">
              {/* ── Top bar: Back + Refresh ── */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToHero}
                  className="flex items-center gap-2 text-[#8B5A2B] hover:text-[#6D4C41] transition-colors"
                >
                  <HomeIcon className="w-5 h-5" />
                  Back to Queue Home
                </button>

                {/* ── REFRESH BUTTON ── */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 text-[#8B5A2B] hover:text-[#6D4C41] transition-colors disabled:opacity-50 bg-white border border-[#E8DED0] px-4 py-2 rounded-lg shadow-sm hover:shadow"
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                  {lastRefreshed && !isRefreshing && (
                    <span className="text-xs text-[#6D4C41]">
                      (
                      {lastRefreshed.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      )
                    </span>
                  )}
                </button>
              </div>

              {/* Status banner */}
              {slotExpired ? (
                <div className="bg-gradient-to-r from-gray-100 to-slate-100 border-2 border-gray-300 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <TimerOff className="w-8 h-8 text-gray-500" />
                    <h3
                      className="text-2xl text-gray-700"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Time Over
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-1">
                    Your selected time slot has ended.
                  </p>
                  <p className="text-gray-500 text-sm">
                    No table was assigned for this queue entry.
                  </p>
                </div>
              ) : showRejoinOption ? (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                    <h3
                      className="text-2xl text-amber-800"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Slot In Progress — No Table Yet
                    </h3>
                  </div>
                  <p className="text-amber-700 mb-4">
                    Your time slot has started but no table is currently
                    available. You can rejoin the queue for a different slot.
                  </p>
                  <button
                    onClick={handleRejoinQueue}
                    className="inline-flex items-center gap-2 bg-[#8B5A2B] text-white px-8 py-3 rounded-lg hover:bg-[#6D4C41] transition-colors shadow-lg font-semibold"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Rejoin Queue
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <h3
                      className="text-2xl text-green-800"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Successfully Joined the Queue!
                    </h3>
                  </div>
                  <p className="text-green-700">
                    We'll notify you immediately when a table becomes available
                  </p>
                </div>
              )}

              {currentUserEntry && !slotExpired && (
                <>
                  {/* Main status card */}
                  <div className="bg-gradient-to-br from-[#8B5A2B] to-[#6D4C41] text-white rounded-2xl p-8 shadow-2xl">
                    <h3
                      className="text-3xl mb-6"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Welcome, {currentUserEntry.name}!
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                        <p className="text-[#EADBC8] mb-2">
                          Your Current Position
                        </p>
                        <p
                          className="text-6xl mb-2"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          #{currentUserEntry.position}
                        </p>
                        <p className="text-sm text-[#EADBC8]">in your queue</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                        <p className="text-[#EADBC8] mb-2">
                          {showRejoinOption ? "Slot Status" : "Time Until Slot"}
                        </p>
                        <p
                          className="text-4xl md:text-6xl mb-2"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {showRejoinOption
                            ? "In Progress"
                            : formatWaitTime(
                                calculateTimeUntilSlot(
                                  currentUserEntry.queueDate,
                                  currentUserEntry.timeSlot
                                )
                              )}
                        </p>
                        <p className="text-sm text-[#EADBC8]">
                          {showRejoinOption
                            ? "No table assigned yet"
                            : "live countdown"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-3 text-[#EADBC8]">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <span>
                        Live updates active — Monitoring for cancellations
                      </span>
                    </div>
                  </div>

                  {/* Details card */}
                  <div className="bg-white rounded-2xl p-8 border border-[#E8DED0] shadow-lg">
                    <h3
                      className="text-2xl mb-6 text-[#8B5A2B]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Reservation Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        ["Customer Name", currentUserEntry.name],
                        ["Number of Guests", `${currentUserEntry.guests} people`],
                        ["Queue Date", new Date(currentUserEntry.queueDate).toLocaleDateString()],
                        ["Time Slot", currentUserEntry.timeSlotDisplay],
                        ["Hall Preference", currentUserEntry.hall],
                        ["Segment Preference", currentUserEntry.segment],
                        ["Contact", currentUserEntry.contact],
                      ].map(([label, value], idx) => (
                        <div key={idx}>
                          <p className="text-sm text-[#6D4C41] mb-1">{label}</p>
                          <p className="text-lg text-[#3E2723] capitalize">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Position + countdown cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 text-center">
                      <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <p className="text-sm text-blue-700 mb-2">
                        Current Position
                      </p>
                      <p
                        className="text-5xl text-blue-900 mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        #{currentUserEntry.position}
                      </p>
                      <p className="text-blue-700">
                        {currentUserEntry.guests} guests •{" "}
                        {currentUserEntry.hall} • {currentUserEntry.segment}
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl p-8 border-2 text-center ${
                        showRejoinOption
                          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                          : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                      }`}
                    >
                      <Clock
                        className={`w-12 h-12 mx-auto mb-4 ${
                          showRejoinOption ? "text-amber-600" : "text-orange-600"
                        }`}
                      />
                      <p
                        className={`text-sm mb-2 ${
                          showRejoinOption ? "text-amber-700" : "text-orange-700"
                        }`}
                      >
                        {showRejoinOption ? "Slot Status" : "Time Until Slot"}
                      </p>
                      {showRejoinOption ? (
                        <>
                          <p
                            className="text-3xl text-amber-900 mb-2 font-semibold"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            In Progress
                          </p>
                          <p className="text-amber-700 text-sm">
                            Slot started — no table yet
                          </p>
                        </>
                      ) : (
                        <>
                          <p
                            className="text-5xl text-orange-900 mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {formatWaitTime(
                              calculateTimeUntilSlot(
                                currentUserEntry.queueDate,
                                currentUserEntry.timeSlot
                              )
                            )}
                          </p>
                          <p className="text-orange-700">
                            Updates automatically
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {showRejoinOption ? (
                    <div className="bg-white rounded-2xl p-6 border border-[#E8DED0] space-y-3">
                      <button
                        onClick={handleRejoinQueue}
                        className="w-full bg-[#8B5A2B] text-white py-3 rounded-lg hover:bg-[#6D4C41] transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Rejoin Queue for Another Slot
                      </button>
                      <button
                        onClick={handleCancelQueue}
                        className="w-full bg-white text-red-600 border border-red-300 py-3 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Cancel Queue Position
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 border border-[#E8DED0] space-y-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowJoinAnotherForm((prev) => !prev);
                            setShowMyQueues(false);
                            setTimeout(
                              () =>
                                joinAnotherRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                }),
                              100
                            );
                          }}
                          className="flex-1 bg-[#8B5A2B]/10 text-[#8B5A2B] border border-[#8B5A2B]/30 py-3 rounded-lg hover:bg-[#8B5A2B]/20 transition-colors flex items-center justify-center gap-2 font-semibold"
                        >
                          <Plus className="w-5 h-5" />
                          Join Another Queue
                        </button>
                        <button
                          onClick={() => {
                            setShowMyQueues((prev) => !prev);
                            setShowJoinAnotherForm(false);
                            setTimeout(
                              () =>
                                myQueuesRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                }),
                              100
                            );
                          }}
                          className="flex-1 bg-[#8B5A2B]/10 text-[#8B5A2B] border border-[#8B5A2B]/30 py-3 rounded-lg hover:bg-[#8B5A2B]/20 transition-colors flex items-center justify-center gap-2 font-semibold"
                        >
                          <List className="w-5 h-5" />
                          View My Queues
                          {allUserQueues.length > 0 && (
                            <span className="bg-[#8B5A2B] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {allUserQueues.length}
                            </span>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={handleCancelQueue}
                        className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Queue Position
                      </button>
                      <p className="text-center text-sm text-[#6D4C41] mt-1">
                        You can rejoin anytime if you change your mind
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Rejoin after slot expired */}
              {slotExpired && (
                <div className="bg-white rounded-2xl p-6 border border-[#E8DED0] text-center">
                  <p className="text-[#6D4C41] mb-4">
                    Would you like to queue for a different time slot?
                  </p>
                  <button
                    onClick={handleRejoinQueue}
                    className="inline-flex items-center gap-2 bg-[#8B5A2B] text-white px-8 py-3 rounded-lg hover:bg-[#6D4C41] transition-colors shadow-lg font-semibold"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Rejoin Queue
                  </button>
                </div>
              )}

              {/* My Queues Panel */}
              {showMyQueues && (
                <div
                  ref={myQueuesRef}
                  className="bg-white rounded-2xl border border-[#E8DED0] shadow-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-8 py-5 border-b border-[#E8DED0]">
                    <h3
                      className="text-2xl text-[#8B5A2B]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      My Queues
                    </h3>
                    <button
                      onClick={() => setShowMyQueues(false)}
                      className="text-[#6D4C41] hover:text-[#3E2723] transition-colors p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {allUserQueues.length === 0 ? (
                    <div className="px-8 py-12 text-center text-[#6D4C41]">
                      <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>You have no active queue entries.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E8DED0]">
                      {allUserQueues.map((entry) => (
                        <div
                          key={entry.id}
                          className={`px-8 py-5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                            currentUserEntry?.id === entry.id
                              ? "bg-[#8B5A2B]/10 border-l-4 border-[#8B5A2B]"
                              : "hover:bg-[#FAF7F2]"
                          }`}
                          onClick={() => {
                            setCurrentUserEntry(entry);
                            checkSlotState(entry);
                            setShowMyQueues(false);
                            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-white bg-[#8B5A2B] rounded-full px-2 py-0.5">
                                #{entry.position}
                              </span>
                              <span className="text-sm font-semibold text-[#3E2723] truncate">
                                {entry.hall} · {entry.segment}
                              </span>
                            </div>
                            <p className="text-sm text-[#6D4C41]">
                              {new Date(entry.queueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}{" "}
                              ·{" "}
                              {TIME_SLOTS.find(
                                (s) => s.value === entry.timeSlot
                              )?.display || entry.timeSlot}
                            </p>
                            <p className="text-sm text-[#6D4C41]">
                              {entry.guests} guests
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {isSlotEnded(entry.queueDate, entry.timeSlot) ? (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <TimerOff className="w-3 h-3" /> Expired
                              </span>
                            ) : isSlotStarted(
                                entry.queueDate,
                                entry.timeSlot
                              ) ? (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> In Progress
                              </span>
                            ) : (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />{" "}
                                Active
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelSpecificQueue(entry.id);
                              }}
                              className="text-xs text-red-500 border border-red-200 hover:bg-red-50 transition-colors rounded-lg px-3 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Join Another Queue Form */}
              {showJoinAnotherForm && (
                <div
                  ref={joinAnotherRef}
                  className="bg-white rounded-2xl border border-[#E8DED0] shadow-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-8 py-5 border-b border-[#E8DED0]">
                    <h3
                      className="text-2xl text-[#8B5A2B]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Join Another Queue
                    </h3>
                    <button
                      onClick={() => setShowJoinAnotherForm(false)}
                      className="text-[#6D4C41] hover:text-[#3E2723] transition-colors p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form
                    onSubmit={handleJoinAnotherQueue}
                    className="px-8 py-6 space-y-6"
                  >
                    <div>
                      <label className="block text-[#3E2723] mb-2">Full Name</label>
                      <input
                        type="text"
                        value={anotherFormData.name}
                        onChange={(e) =>
                          setAnotherFormData({ ...anotherFormData, name: e.target.value })
                        }
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#3E2723] mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        value={anotherFormData.contact}
                        onChange={(e) =>
                          setAnotherFormData({ ...anotherFormData, contact: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white"
                        required
                      />
                    </div>
                    {/* Guests */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">Number of Guests</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setAnotherGuestsOpen(!anotherGuestsOpen)}
                          className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left flex items-center justify-between"
                        >
                          <span>{anotherFormData.guests} guests</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${anotherGuestsOpen ? "rotate-180" : ""}`} />
                        </button>
                        {anotherGuestsOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E8DED0] rounded-lg shadow-lg z-10">
                            <div className="grid grid-cols-5 gap-3 p-2">
                              {["1","2","3","4","5","6","7","8","9","10"].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => {
                                    setAnotherFormData({ ...anotherFormData, guests: num });
                                    setAnotherGuestsOpen(false);
                                  }}
                                  className={`py-3 rounded-lg border-2 transition-all ${
                                    anotherFormData.guests === num
                                      ? "border-[#8B5A2B] bg-[#8B5A2B] text-white"
                                      : "border-[#E8DED0] text-[#3E2723] hover:border-[#8B5A2B]"
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Date */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">Queue Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B] pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setAnotherCalendar(!anotherCalendar)}
                          className="w-full pl-12 pr-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left"
                        >
                          {new Date(anotherFormData.queueDate).toLocaleDateString("en-US", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                          })}
                        </button>
                      </div>
                      {anotherCalendar && (
                        <div className="mt-3 p-4 border border-[#E8DED0] rounded-lg bg-white shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => changeAnotherMonth(-1)}
                              className="p-2 hover:bg-[#E8DED0] rounded-lg transition-colors"
                              disabled={
                                anotherMonth.getMonth() === new Date().getMonth() &&
                                anotherMonth.getFullYear() === new Date().getFullYear()
                              }
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-semibold text-[#3E2723]">
                              {monthNames[anotherMonth.getMonth()]} {anotherMonth.getFullYear()}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeAnotherMonth(1)}
                              className="p-2 hover:bg-[#E8DED0] rounded-lg transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => (
                              <div key={day} className="text-xs font-semibold text-[#6D4C41] p-2">{day}</div>
                            ))}
                            {renderCalendarDays(anotherMonth, anotherFormData.queueDate, handleAnotherDateSelect)}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Time Slot */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">Time Slot</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B5A2B] pointer-events-none" />
                        <select
                          value={anotherFormData.timeSlot}
                          onChange={(e) => setAnotherFormData({ ...anotherFormData, timeSlot: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white"
                          required
                        >
                          {anotherAvailableTimeSlots.length === 0 ? (
                            <option value="">No available slots for this date</option>
                          ) : (
                            anotherAvailableTimeSlots.map((slot) => (
                              <option key={slot.value} value={slot.value}>{slot.display}</option>
                            ))
                          )}
                        </select>
                      </div>
                      {anotherAvailableTimeSlots.length === 0 && (
                        <p className="text-sm text-red-600 mt-2">All time slots have passed. Please select a future date.</p>
                      )}
                    </div>
                    {/* Hall */}
                    <div>
                      <label className="block text-[#3E2723] mb-2">Location Preference (Hall)</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setAnotherHallOpen(!anotherHallOpen)}
                          className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left"
                        >
                          {anotherFormData.hall}
                          <ChevronDown className="w-4 h-4 ml-2 inline-block" />
                        </button>
                        {anotherHallOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E8DED0] rounded-lg shadow-lg z-10">
                            <div className="grid grid-cols-4 gap-3 p-2">
                              {["AC Hall","Main Hall","VIP Hall","Any"].map((hall) => (
                                <button
                                  key={hall}
                                  type="button"
                                  onClick={() => {
                                    setAnotherFormData({ ...anotherFormData, hall: hall as any });
                                    setAnotherHallOpen(false);
                                  }}
                                  className={`py-3 rounded-lg border-2 transition-all ${
                                    anotherFormData.hall === hall
                                      ? "border-[#8B5A2B] bg-[#8B5A2B] text-white"
                                      : "border-[#E8DED0] text-[#3E2723] hover:border-[#8B5A2B]"
                                  }`}
                                >
                                  {hall}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Segment */}
                    <div>
                      <label className="block text-[#3E2323] mb-2">Segment Preference</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setAnotherSegmentOpen(!anotherSegmentOpen)}
                          className="w-full px-4 py-3 border border-[#E8DED0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] bg-white text-left"
                        >
                          {anotherFormData.segment}
                          <ChevronDown className="w-4 h-4 ml-2 inline-block" />
                        </button>
                        {anotherSegmentOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E8DED0] rounded-lg shadow-lg z-10">
                            <div className="grid grid-cols-4 gap-3 p-2">
                              {["Front","Middle","Back","Any"].map((segment) => (
                                <button
                                  key={segment}
                                  type="button"
                                  onClick={() => {
                                    setAnotherFormData({ ...anotherFormData, segment: segment as any });
                                    setAnotherSegmentOpen(false);
                                  }}
                                  className={`py-3 rounded-lg border-2 transition-all ${
                                    anotherFormData.segment === segment
                                      ? "border-[#8B5A2B] bg-[#8B5A2B] text-white"
                                      : "border-[#E8DED0] text-[#3E2723] hover:border-[#8B5A2B]"
                                  }`}
                                >
                                  {segment}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={anotherAvailableTimeSlots.length === 0}
                      className="w-full bg-[#8B5A2B] text-white py-4 rounded-lg hover:bg-[#6D4C41] transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Check Availability & Join
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Availability Dialog ── */}
      {showAvailabilityDialog && currentUserEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-[#8B5A2B] overflow-hidden">
            <div className="bg-gradient-to-r from-[#8B5A2B] to-[#6D4C41] px-8 py-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center justify-center mb-3">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <Bell className="w-8 h-8 text-white animate-bounce" />
                </div>
              </div>
              <h3
                className="text-white text-2xl text-center"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                🎉 Table Available!
              </h3>
              <p className="text-white/90 text-center text-sm mt-2">
                {getAvailabilityMessage()}
              </p>
            </div>
            <div className="px-8 py-6">
              <p className="text-center text-gray-700 text-lg mb-6">
                A table for{" "}
                <span className="font-bold text-[#8B5A2B]">
                  {currentUserEntry.guests} guests
                </span>{" "}
                in the{" "}
                <span className="font-bold text-[#8B5A2B]">
                  {currentUserEntry.hall}
                </span>{" "}
                ({currentUserEntry.segment} segment) is now available!
              </p>
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-amber-800">
                  <Clock className="w-5 h-5" />
                  <p className="text-sm font-semibold">
                    Time remaining: {formatCountdown(countdownSeconds)}
                  </p>
                </div>
                <p className="text-center text-xs text-amber-700 mt-1">
                  Table will be auto-cancelled and offered to next customer if no response
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleConfirmTable}
                  className="w-full bg-[#8B5A2B] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#6D4822] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Confirm & Reserve Table
                </button>
                <button
                  onClick={handleDeclineTable}
                  className="w-full bg-white text-gray-700 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Decline — Try Another Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 15-min warning dialog ── */}
      {show15MinNoTableDialog && currentUserEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-amber-400 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center justify-center mb-3">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3
                className="text-white text-2xl text-center"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                ⏰ 15 Minutes to Your Slot
              </h3>
              <p className="text-white/90 text-center text-sm mt-2">
                Your slot starts soon — no table is free yet
              </p>
            </div>
            <div className="px-8 py-6">
              <p className="text-center text-gray-700 mb-2">
                Your time slot{" "}
                <span className="font-bold text-[#8B5A2B]">
                  {currentUserEntry.timeSlotDisplay}
                </span>{" "}
                begins in under 15 minutes.
              </p>
              <p className="text-center text-gray-600 text-sm mb-6">
                All tables are currently occupied. We're still monitoring for
                cancellations — you'll be instantly notified if one opens up.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-center">
                <p className="text-xs text-amber-700">
                  💡 Tip: You can also join another slot's queue as a backup while you wait.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShow15MinNoTableDialog(false);
                    setShowJoinAnotherForm(true);
                    setTimeout(
                      () =>
                        joinAnotherRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                      200
                    );
                  }}
                  className="w-full bg-[#8B5A2B] text-white py-3 rounded-lg font-semibold hover:bg-[#6D4C41] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Join Another Queue as Backup
                </button>
                <button
                  onClick={() => setShow15MinNoTableDialog(false)}
                  className="w-full bg-white text-gray-600 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep Waiting for This Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Slot started dialog ── */}
      {showSlotStartedDialog && currentUserEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-orange-400 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center justify-center mb-3">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3
                className="text-white text-2xl text-center"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                🍽️ Your Slot Has Begun!
              </h3>
              <p className="text-white/90 text-center text-sm mt-2">
                No table is ready for you yet
              </p>
            </div>
            <div className="px-8 py-6">
              <p className="text-center text-gray-700 mb-2">
                Your time slot{" "}
                <span className="font-bold text-[#8B5A2B]">
                  {currentUserEntry.timeSlotDisplay}
                </span>{" "}
                has started.
              </p>
              <p className="text-center text-gray-600 text-sm mb-6">
                No table has been freed up yet. We'll notify you instantly the
                moment one becomes available. You can also join a backup queue
                for another slot.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSlotStartedDialog(false);
                    setShowJoinAnotherForm(true);
                    setTimeout(
                      () =>
                        joinAnotherRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                      200
                    );
                  }}
                  className="w-full bg-[#8B5A2B] text-white py-3 rounded-lg font-semibold hover:bg-[#6D4C41] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Join Queue for Another Slot
                </button>
                <button
                  onClick={() => setShowSlotStartedDialog(false)}
                  className="w-full bg-white text-gray-600 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep Waiting — Notify Me When Ready
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Slot expired dialog ── */}
      {showSlotExpiredDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-gray-400 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-500 to-slate-600 px-8 py-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center justify-center mb-3">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <TimerOff className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3
                className="text-white text-2xl text-center"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                ⌛ Time's Up
              </h3>
              <p className="text-white/90 text-center text-sm mt-2">
                Your queue slot has ended without a table
              </p>
            </div>
            <div className="px-8 py-6">
              <p className="text-center text-gray-700 mb-2">
                We're sorry — your time slot has passed and no table could be
                assigned to you.
              </p>
              <p className="text-center text-gray-600 text-sm mb-6">
                Would you like to queue again for a different slot?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSlotExpiredDialog(false);
                    handleRejoinQueue();
                  }}
                  className="w-full bg-[#8B5A2B] text-white py-3 rounded-lg font-semibold hover:bg-[#6D4C41] transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Rejoin Queue for Another Slot
                </button>
                <button
                  onClick={() => setShowSlotExpiredDialog(false)}
                  className="w-full bg-white text-gray-600 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
@echo off
REM Script to track changes, commit, and push to Git repository
REM Asks for commit message and branch selections

setlocal enabledelayedexpansion

echo ========================================
echo Git Commit and Push Script
echo ========================================
echo.

REM Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH.
    echo Please install Git first using setup-git-and-clone.bat
    pause
    exit /b 1
)

REM Check if we're in a Git repository
git rev-parse --git-dir >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Not a Git repository. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Current Git Status
echo ========================================
echo.

REM Show current status
git status

echo.
echo ========================================
echo Select Branch
echo ========================================
echo.

REM Get list of branches
echo Available branches:
echo.
for /f "tokens=*" %%i in ('git branch -a') do (
    echo %%i
)

echo.
set /p GIT_BRANCH="Enter branch name to push to (e.g., main, develop, feature/menu-module): "

REM Verify branch exists or create it
git rev-parse --verify %GIT_BRANCH% >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo Branch '%GIT_BRANCH%' does not exist locally.
    set /p CREATE_BRANCH="Create new branch '%GIT_BRANCH%'? (y/n): "
    
    if /i "!CREATE_BRANCH!"=="y" (
        echo Creating branch '%GIT_BRANCH%'...
        git checkout -b %GIT_BRANCH%
        if !errorlevel! neq 0 (
            echo Failed to create branch.
            pause
            exit /b 1
        )
        echo Branch '%GIT_BRANCH%' created successfully.
    ) else (
        echo Operation cancelled.
        pause
        exit /b 1
    )
) else (
    echo Switching to branch '%GIT_BRANCH%'...
    git checkout %GIT_BRANCH%
    if !errorlevel! neq 0 (
        echo Failed to switch to branch.
        pause
        exit /b 1
    )
    echo Successfully switched to branch '%GIT_BRANCH%'.
)

echo.
echo ========================================
echo Enter Commit Message
echo ========================================
echo.
echo Examples:
echo   - "feat: add order management features"
echo   - "fix: resolve kitchen display bug"
echo   - "docs: update README with setup instructions"
echo   - "refactor: reorganize menu components"
echo.

set /p COMMIT_MESSAGE="Enter commit message: "

if "!COMMIT_MESSAGE!"=="" (
    echo Error: Commit message cannot be empty.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Summary
echo ========================================
echo Branch: %GIT_BRANCH%
echo Message: !COMMIT_MESSAGE!
echo.

set /p CONFIRM="Proceed with commit and push? (y/n): "

if /i "!CONFIRM!"=="y" (
    echo.
    echo ========================================
    echo Processing...
    echo ========================================
    echo.
    
    REM Stage all changes
    echo Staging all changes...
    git add .
    if %errorlevel% neq 0 (
        echo Error: Failed to stage changes.
        pause
        exit /b 1
    )
    
    REM Commit changes
    echo Committing changes...
    git commit -m "!COMMIT_MESSAGE!"
    if %errorlevel% neq 0 (
        echo Error: Failed to commit changes.
        echo.
        echo Possible reasons:
        echo - No changes to commit
        echo - Invalid commit message
        pause
        exit /b 1
    )
    
    REM Push changes
    echo Pushing to branch '%GIT_BRANCH%'...
    git push -u origin %GIT_BRANCH%
    if %errorlevel% neq 0 (
        echo Error: Failed to push changes.
        echo.
        echo Please check:
        echo - Your internet connection
        echo - Your GitHub credentials
        echo - The remote repository exists
        echo.
        echo Try pushing manually:
        echo   git push -u origin %GIT_BRANCH%
        pause
        exit /b 1
    )
    
    echo.
    echo ========================================
    echo Success!
    echo ========================================
    echo.
    echo Changes have been committed and pushed to:
    echo Repository: https://github.com/Muzzammil777/Restaurant-Management-System.git
    echo Branch: %GIT_BRANCH%
    echo Message: !COMMIT_MESSAGE!
    echo.
    echo You can now create a Pull Request on GitHub if needed.
    echo.
    
) else (
    echo Operation cancelled.
)

echo.
pause

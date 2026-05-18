import os
import subprocess
import sys
from datetime import datetime

# Configuration
SERVICES_MAP = {
    "auth-service": "auth-service",
    "ticket-service": "ticket-service",
    "orq": "orq",
    "FAQ-service": "faq-service",
    "logging-service": "logging-service",
    "notification-service": "notification-service",
    "chat-service": "chat-service",
    "emergency-service": "emergency-service",
    "emergencyCall-service": "emergency-call-service",
    "profile-service": "profile-service",
    "academic-service": "academic-service",
    "calendar-service": "calendar-service",
    "map-service": "map-service",
    "post-service": "post-service",
    "feed-service": "feed-service",
    "frontent-service": "frontend"
}

def run_command(command, cwd=None):
    print(f"Executing: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True, cwd=cwd, encoding="utf-8", errors="replace")
    return result

def get_changed_services():
    # Get changed files from git
    # If not in a git repo or no commits, fallback to all services
    try:
        # Check files changed in the last commit OR staged/unstaged changes
        result = subprocess.run(["git", "diff", "--name-only", "HEAD"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        changed_files = result.stdout.splitlines()
        
        # Also check staged changes
        result_staged = subprocess.run(["git", "diff", "--cached", "--name-only"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        changed_files += result_staged.stdout.splitlines()
        
        # And untracked files
        result_untracked = subprocess.run(["git", "ls-files", "--others", "--exclude-standard"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        changed_files += result_untracked.stdout.splitlines()

    except Exception as e:
        print(f"Git error: {e}. Defaulting to all services.")
        return list(SERVICES_MAP.values())

    changed_services = set()
    for file in changed_files:
        parts = file.split('/')
        if parts[0] in SERVICES_MAP:
            changed_services.add(SERVICES_MAP[parts[0]])
        elif parts[0] == "docker-compose.yaml":
            # If compose file changes, rebuild everything?
            # For this exercise, let's just return all
            return list(SERVICES_MAP.values())

    return list(changed_services)

def main():
    print("Starting LAAC Smart Pipeline...")
    
    changed_services = get_changed_services()
    if not changed_services:
        print("No services updated. Skipping build.")
        # We might still want to run tests if specified, but for now we skip
        # return
    else:
        print(f"Detected changes in: {', '.join(changed_services)}")

    report = [
        "# LAAC Pipeline Report",
        f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Build Status"
    ]

    # 1. Build Phase
    build_success = True
    for service in changed_services:
        print(f"Building {service}...")
        res = run_command(["docker-compose", "build", service])
        if res.returncode == 0:
            report.append(f"- [OK] **{service}**: Build successful")
        else:
            report.append(f"- [FAIL] **{service}**: Build failed\n```\n{res.stderr}\n```")
            build_success = False

    # 2. Test Phase
    report.append("\n## Test Results")
    test_success = True
    
    # We'll run tests for all services that HAVE a tests folder, or just changed ones?
    # Usually better to run all unit tests to prevent regressions.
    for folder, service in SERVICES_MAP.items():
        test_dir = os.path.join(folder, "tests")
        if os.path.exists(test_dir):
            print(f"Running tests for {service}...")
            # Running tests inside the container ensures the correct environment
            res = run_command(["docker-compose", "run", "--rm", service, "python", "-m", "pytest", "tests"])
            
            if res.returncode == 0:
                report.append(f"- [OK] **{service}**: All tests passed")
            else:
                # Capture stdout for failure details
                report.append(f"- [FAIL] **{service}**: Tests failed\n```\n{res.stdout or res.stderr}\n```")
                test_success = False
        else:
            # report.append(f"- [INFO] **{service}**: No tests found")
            pass

    # 3. Final Summary
    report.append("\n## Summary")
    if build_success and test_success:
        report.append("**Status: ALL GREEN**")
    else:
        report.append("**Status: FAILURES DETECTED**")

    # Write report
    with open("test_report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report))

    print("\n" + "\n".join(report))
    print(f"\nReport saved to test_report.md")

    if not (build_success and test_success):
        sys.exit(1)

if __name__ == "__main__":
    main()

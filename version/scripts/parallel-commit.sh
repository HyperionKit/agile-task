#!/bin/bash

# HyperKit Parallel Git Commit Script
# Task-Aware Version - Aligned with TASK_TEMPLATE.md

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BRIGHT='\033[1m'
NC='\033[0m'

# Configuration
MAX_CONCURRENT=5
DRY_RUN=false

# Task paths (aligned with TASK_TEMPLATE.md)
TASK_ACTIVE="src/documentation/agile.role"
TASK_DELIVER="src/documentation/deliver"
TASK_OVERDUE="src/documentation/overdue"
TASK_REFERENCE="src/documentation/reference"

# Task pattern: TASK-S[Sprint]-[Number]-[description].md
TASK_PATTERN="TASK-S([0-9]+)-([0-9]+)-(.+)\.md$"

print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

show_help() {
    print_color $BRIGHT "========================================"
    print_color $BRIGHT "HyperKit Parallel Commit"
    print_color $CYAN "Task-Aware Version"
    print_color $BRIGHT "========================================"
    echo ""
    print_color $CYAN "Usage: $0 [options]"
    print_color $CYAN ""
    print_color $CYAN "Options:"
    print_color $CYAN "  --dry-run    Preview commits without executing"
    print_color $CYAN "  --help, -h   Show this help message"
    print_color $CYAN "  --max N      Set max concurrent commits (default: $MAX_CONCURRENT)"
    print_color $CYAN ""
    print_color $CYAN "Task-Aware Features:"
    print_color $CYAN "  - Detects TASK-S[X]-[XXX] files"
    print_color $CYAN "  - Generates task(ID): messages"
    print_color $CYAN "  - Marks P0 overdue tasks"
    print_color $CYAN "  - Tracks deliver/complete moves"
}

# Get file category
get_category() {
    local file=$1
    if [[ "$file" == *"$TASK_OVERDUE"* ]]; then
        echo "overdue"
    elif [[ "$file" == *"$TASK_DELIVER"* ]]; then
        echo "deliver"
    elif [[ "$file" == *"$TASK_ACTIVE"* ]]; then
        echo "tasks"
    elif [[ "$file" == *"$TASK_REFERENCE"* ]]; then
        echo "reference"
    elif [[ "$file" == *".github"* ]]; then
        echo "ci"
    elif [[ "$file" == *"version/scripts"* ]]; then
        echo "scripts"
    else
        echo "other"
    fi
}

# Generate task-aware commit message
get_commit_message() {
    local file=$1
    local status=$2
    local filename=$(basename "$file")
    local dirpath=$(dirname "$file")
    local dirname=$(basename "$dirpath")
    local category=$(get_category "$file")
    
    # Check if task file
    if [[ "$filename" =~ $TASK_PATTERN ]]; then
        local sprint="${BASH_REMATCH[1]}"
        local tasknum="${BASH_REMATCH[2]}"
        local desc="${BASH_REMATCH[3]}"
        local taskid="TASK-S${sprint}-${tasknum}"
        local taskdesc=$(echo "$desc" | sed 's/-/ /g')
        
        # Determine action based on location
        if [[ "$category" == "deliver" ]]; then
            echo "task(${taskid}): complete ${taskdesc}"
        elif [[ "$category" == "overdue" ]]; then
            echo "task(${taskid}): [P0] escalate ${taskdesc}"
        elif [[ "$status" == *"A"* ]]; then
            echo "task(${taskid}): create ${taskdesc}"
        elif [[ "$status" == *"D"* ]]; then
            echo "task(${taskid}): archive ${taskdesc}"
        else
            echo "task(${taskid}): update ${taskdesc}"
        fi
        return
    fi
    
    # Sprint overview
    if [[ "$filename" == "SPRINT_OVERVIEW.md" ]]; then
        echo "sprint: update sprint overview"
        return
    fi
    
    # Task template
    if [[ "$filename" == "TASK_TEMPLATE.md" ]]; then
        echo "docs: update task template"
        return
    fi
    
    # Reference docs
    if [[ "$category" == "reference" ]]; then
        if [[ "$status" == *"A"* ]]; then
            echo "docs: add reference ${filename}"
        else
            echo "docs: update reference ${filename}"
        fi
        return
    fi
    
    # Deliver folder
    if [[ "$category" == "deliver" ]]; then
        echo "deliver: archive ${filename}"
        return
    fi
    
    # Standard messages
    case "$status" in
        *A*) echo "feat: add ${filename}${dirname:+ in ${dirname}}" ;;
        *M*) echo "update: modify ${filename}${dirname:+ in ${dirname}}" ;;
        *D*) echo "remove: delete ${filename}" ;;
        *R*) echo "refactor: rename ${filename}" ;;
        *) echo "chore: update ${filename}" ;;
    esac
}

commit_file() {
    local file="$1"
    local status="$2"
    local category=$(get_category "$file")
    local commit_msg=$(get_commit_message "$file" "$status")
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_color $YELLOW "[DRY RUN] Would commit: \"$file\""
        print_color $CYAN "          Message: \"$commit_msg\""
        return 0
    fi
    
    if git add "$file" 2>/dev/null; then
        if git commit -m "$commit_msg" 2>/dev/null; then
            print_color $GREEN "Committed: \"$file\""
            print_color $CYAN "  Message: \"$commit_msg\""
            return 0
        else
            print_color $RED "Failed to commit \"$file\""
            return 1
        fi
    else
        print_color $RED "Failed to add \"$file\""
        return 1
    fi
}

process_files() {
    local files=("$@")
    local success_count=0
    local fail_count=0
    local pids=()
    
    print_color $CYAN "Processing ${#files[@]} files (max $MAX_CONCURRENT concurrent)..."
    
    for ((i=0; i<${#files[@]}; i+=MAX_CONCURRENT)); do
        for ((j=i; j<i+MAX_CONCURRENT && j<${#files[@]}; j++)); do
            local file_info="${files[j]}"
            local file=$(echo "$file_info" | cut -d'|' -f1)
            local status=$(echo "$file_info" | cut -d'|' -f2)
            
            commit_file "$file" "$status" &
            pids+=($!)
        done
        
        for pid in "${pids[@]}"; do
            wait $pid
            if [[ $? -eq 0 ]]; then
                ((success_count++))
            else
                ((fail_count++))
            fi
        done
        pids=()
    done
    
    echo ""
    print_color $BRIGHT "========================================"
    print_color $BRIGHT "COMMIT SUMMARY"
    print_color $BRIGHT "========================================"
    print_color $BLUE "Total: ${#files[@]} files"
    print_color $GREEN "Success: $success_count"
    if [[ $fail_count -gt 0 ]]; then
        print_color $RED "Failed: $fail_count"
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        --max)
            MAX_CONCURRENT="$2"
            shift 2
            ;;
        *)
            print_color $RED "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main
print_color $BRIGHT "========================================"
print_color $BRIGHT "HyperKit Parallel Commit"
print_color $CYAN "Task-Aware Version"
print_color $BRIGHT "========================================"

if [[ "$DRY_RUN" == "true" ]]; then
    print_color $YELLOW "\nDRY RUN MODE - No commits will be made"
fi

# Check git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_color $RED "Not in a git repository!"
    exit 1
fi

# Get changed files
print_color $BLUE "\nScanning for changes..."
declare -a changed_files
declare -A categories

while IFS= read -r line; do
    if [[ -n "$line" ]]; then
        status="${line:0:2}"
        file="${line:3}"
        file=$(echo "$file" | sed 's/^["'\'']\|["'\'']$//g')
        
        # Skip excluded
        if [[ "$file" =~ node_modules/ ]] || 
           [[ "$file" =~ \.git/ ]] || 
           [[ "$file" =~ \.log$ ]] || 
           [[ "$file" =~ \.tmp$ ]]; then
            continue
        fi
        
        changed_files+=("$file|$status")
        
        # Count categories
        cat=$(get_category "$file")
        categories[$cat]=$((${categories[$cat]:-0} + 1))
    fi
done < <(git status --porcelain)

if [[ ${#changed_files[@]} -eq 0 ]]; then
    print_color $GREEN "No changes to commit"
    exit 0
fi

print_color $BLUE "\nFound ${#changed_files[@]} changed files:"

# Sort: P0 first
sorted_files=()
for file_info in "${changed_files[@]}"; do
    file=$(echo "$file_info" | cut -d'|' -f1)
    cat=$(get_category "$file")
    if [[ "$cat" == "overdue" ]]; then
        sorted_files=("$file_info" "${sorted_files[@]}")
    else
        sorted_files+=("$file_info")
    fi
done

# Display files
for file_info in "${sorted_files[@]}"; do
    file=$(echo "$file_info" | cut -d'|' -f1)
    status=$(echo "$file_info" | cut -d'|' -f2)
    cat=$(get_category "$file")
    
    case "$status" in
        *A*) icon="+" ;;
        *M*) icon="~" ;;
        *D*) icon="-" ;;
        *) icon="?" ;;
    esac
    
    case "$cat" in
        overdue) label="[P0]"; color=$RED ;;
        tasks) label="[TASK]"; color=$BLUE ;;
        deliver) label="[DONE]"; color=$GREEN ;;
        *) label="[${cat^^}]"; color=$BLUE ;;
    esac
    
    print_color $color "  $icon $label $file"
done

# Show category summary
echo ""
print_color $BRIGHT "Categories:"
for cat in "${!categories[@]}"; do
    case "$cat" in
        overdue) label="P0" ;;
        tasks) label="TASK" ;;
        deliver) label="DONE" ;;
        *) label="${cat^^}" ;;
    esac
    print_color $BLUE "  [$label] ${categories[$cat]} files"
done

echo ""
process_files "${sorted_files[@]}"

if [[ "$DRY_RUN" == "false" ]]; then
    print_color $GREEN "\nAll commits completed!"
fi

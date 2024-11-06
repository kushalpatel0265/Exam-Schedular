#include <bits/stdc++.h>
using namespace std;

// Structure to represent an Exam
struct Exam
{
    int id;
    string name;
    int numStudents;
    vector<int> students; // List of student IDs
};

// Structure to represent a Room
struct Room
{
    int id;
    int capacity;
};

// Structure to represent a Time Slot
struct TimeSlot
{
    int id;
    string date; // Format: "YYYY-MM-DD"
    string slot; // "Morning" or "Afternoon"
};

// Structure to represent an Assignment (TimeSlot and Room)
struct Assignment
{
    int timeslot; // TimeSlot ID
    int room;     // Room ID
};

// Function to check if two exams have any common students
bool haveConflict(const Exam &e1, const Exam &e2)
{
    unordered_set<int> students_e1(e1.students.begin(), e1.students.end());
    for (auto student : e2.students)
    {
        if (students_e1.find(student) != students_e1.end())
            return true;
    }
    return false;
}

// Function to calculate conflicts between exams
vector<vector<bool>> buildConflictMatrix(const vector<Exam> &exams)
{
    int n = exams.size();
    vector<vector<bool>> conflict(n, vector<bool>(n, false));
    for (int i = 0; i < n; i++)
    {
        for (int j = i + 1; j < n; j++)
        {
            if (haveConflict(exams[i], exams[j]))
            {
                conflict[i][j] = conflict[j][i] = true;
            }
        }
    }
    return conflict;
}

// Function to select the next exam to assign (MRV heuristic)
int selectUnassignedExam(const vector<Assignment> &assignments, const vector<Exam> &exams,
                         const vector<vector<bool>> &conflict,
                         const vector<Room> &rooms,
                         const vector<TimeSlot> &timeslots,
                         const vector<vector<pair<int, int>>> &domains)
{
    int n = exams.size();
    int selected = -1;
    int minRemaining = INT32_MAX;
    for (int i = 0; i < n; i++)
    {
        if (assignments[i].timeslot == -1)
        { // Unassigned
            int remaining = domains[i].size();
            if (remaining < minRemaining)
            {
                minRemaining = remaining;
                selected = i;
            }
        }
    }
    return selected;
}

// Function to order the possible assignments (LCV heuristic)
vector<pair<int, int>> orderDomainValues(int exam, const vector<Exam> &exams,
                                         const vector<Assignment> &assignments,
                                         const vector<vector<bool>> &conflict,
                                         const vector<Room> &rooms,
                                         const vector<TimeSlot> &timeslots,
                                         const vector<vector<pair<int, int>>> &domains)
{
    // For simplicity, return the domain as is.
    // Implementing true LCV would require counting constraints each value imposes.
    // This is a placeholder for the LCV heuristic.
    return domains[exam];
}

// Function to check if assigning a specific time slot and room is valid
bool isValid(int exam, pair<int, int> assign, const vector<Assignment> &assignments,
             const vector<Exam> &exams, const vector<Room> &rooms,
             const vector<TimeSlot> &timeslots,
             const vector<vector<bool>> &conflict)
{
    int ts = assign.first;
    int rm = assign.second;
    // Check room capacity
    if (rooms[rm].capacity < exams[exam].numStudents)
        return false;
    // Check for room availability and student conflicts
    for (int i = 0; i < exams.size(); i++)
    {
        if (assignments[i].timeslot == ts)
        {
            // Room conflict
            if (assignments[i].room == rm)
                return false;
            // Student conflict
            if (conflict[exam][i])
                return false;
        }
    }
    return true;
}

// Recursive Backtracking function
bool backtrack(vector<Assignment> &assignments, const vector<Exam> &exams,
               const vector<Room> &rooms, const vector<TimeSlot> &timeslots,
               const vector<vector<bool>> &conflict,
               vector<vector<pair<int, int>>> &domains)
{
    // Check if all exams are assigned
    bool complete = true;
    for (auto &a : assignments)
    {
        if (a.timeslot == -1)
        {
            complete = false;
            break;
        }
    }
    if (complete)
        return true;

    // Select the next exam to assign
    int exam = selectUnassignedExam(assignments, exams, conflict, rooms, timeslots, domains);
    if (exam == -1)
        return false; // No solution

    // Order the domain values
    vector<pair<int, int>> ordered = orderDomainValues(exam, exams, assignments, conflict, rooms, timeslots, domains);

    for (auto &assign : ordered)
    {
        if (isValid(exam, assign, assignments, exams, rooms, timeslots, conflict))
        {
            // Assign
            assignments[exam] = {assign.first, assign.second};

            // Save current domains for backtracking
            vector<vector<pair<int, int>>> domains_backup = domains;

            // Forward Checking: reduce domains of conflicting exams
            for (int i = 0; i < exams.size(); i++)
            {
                if (conflict[exam][i] && assignments[i].timeslot == -1)
                {
                    // Remove assignments with the same time slot
                    vector<pair<int, int>> new_domain;
                    for (auto &a : domains[i])
                    {
                        if (a.first != assign.first || a.second != assign.second)
                        { // Room constraint is already handled by isValid
                            new_domain.push_back(a);
                        }
                    }
                    domains[i] = new_domain;
                    if (domains[i].empty())
                    {
                        // Failure, backtrack
                        assignments[exam] = {-1, -1};
                        domains = domains_backup;
                        goto next_assignment;
                    }
                }
            }

            // Continue with recursion
            if (backtrack(assignments, exams, rooms, timeslots, conflict, domains))
                return true;

            // Backtrack
            assignments[exam] = {-1, -1};
            domains = domains_backup;
        }
    next_assignment:;
    }
    return false;
}

int main()
{
    // Sample Data
    // Define Exams
    vector<Exam> exams = {
        {1, "Mathematics", 3, {101, 102, 103}},
        {2, "Physics", 2, {102, 104}},
        {3, "Chemistry", 2, {105, 106}},
        {4, "Biology", 1, {107}},
        {5, "English", 2, {108, 109}},
    };

    // Define Rooms
    vector<Room> rooms = {
        {201, 2},
        {202, 3},
        {203, 1},
        {204, 4},
    };

    // Define Time Slots
    vector<TimeSlot> timeslots = {
        {1, "2024-12-10", "Morning"},
        {2, "2024-12-10", "Afternoon"},
        {3, "2024-12-11", "Morning"},
        {4, "2024-12-11", "Afternoon"},
        {5, "2024-12-12", "Morning"},
        {6, "2024-12-12", "Afternoon"},
    };

    // Build Conflict Matrix
    vector<vector<bool>> conflict = buildConflictMatrix(exams);

    // Initialize Assignments (-1 means unassigned)
    vector<Assignment> assignments(exams.size(), {-1, -1});

    // Initialize Domains for each exam (all possible time slot and room combinations)
    vector<vector<pair<int, int>>> domains(exams.size());
    for (int i = 0; i < exams.size(); i++)
    {
        for (int t = 0; t < timeslots.size(); t++)
        {
            for (int r = 0; r < rooms.size(); r++)
            {
                if (rooms[r].capacity >= exams[i].numStudents)
                    domains[i].emplace_back(make_pair(timeslots[t].id, rooms[r].id));
            }
        }
    }

    // Start Backtracking
    bool success = backtrack(assignments, exams, rooms, timeslots, conflict, domains);

    if (success)
    {
        cout << "Scheduling Successful!\n";
        for (int i = 0; i < assignments.size(); i++)
        {
            cout << "Exam " << exams[i].id << " (" << exams[i].name << ") scheduled on "
                 << "\"" << timeslots[assignments[i].timeslot - 1].date << "\", "
                 << timeslots[assignments[i].timeslot - 1].slot
                 << " in Room " << rooms[assignments[i].room].id << "\n";
        }
    }
    else
    {
        cout << "No feasible schedule found.\n";
    }

    return 0;
}

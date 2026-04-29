# Requirements Document

## Introduction

This document specifies requirements for the Deactivated User Data Visibility feature in the MilBaant flatmate expense management application. The feature enables automatic hiding of deactivated users' data across all application views while providing administrators with controls to toggle visibility of historical data when needed.

Currently, when a user is deactivated (is_active = false), their data remains visible in all lists, calculations, and summaries. This creates confusion and clutters the interface with inactive members' information. The feature will filter out deactivated users' data by default while preserving the ability for administrators to view complete historical records when necessary.

## Glossary

- **System**: The MilBaant flatmate expense management application
- **Deactivated_User**: A user profile with is_active field set to false
- **Active_User**: A user profile with is_active field set to true
- **Admin**: A user with role = 'admin'
- **Data_Filter**: A mechanism that excludes deactivated users' data from queries and displays
- **Visibility_Toggle**: A UI control that allows admins to show or hide deactivated users' data
- **User_Preference**: A persistent setting stored in browser local storage
- **Expense_Data**: Records from expenses, expense_participants, and weekend meal participation
- **Ride_Data**: Records from rides and ride_riders tables
- **Cook_Data**: Records from cook_advances and cook_purchases tables
- **Contribution_Data**: Records from contribution_payments table
- **Balance_Calculation**: Monthly summary computations including fixed share, weekend share, and total owed
- **User_List**: Any display showing multiple user profiles or names
- **Historical_Data**: All records created by or associated with deactivated users

## Requirements

### Requirement 1: Default Data Filtering

**User Story:** As a flatmate, I want deactivated users' data hidden by default, so that I only see information relevant to current residents.

#### Acceptance Criteria

1. WHEN the System loads expense data, THE Data_Filter SHALL exclude expenses where created_by references a Deactivated_User
2. WHEN the System loads expense data, THE Data_Filter SHALL exclude expense_participants records where user_id references a Deactivated_User
3. WHEN the System loads ride data, THE Data_Filter SHALL exclude rides where created_by or paid_by references a Deactivated_User
4. WHEN the System loads ride data, THE Data_Filter SHALL exclude ride_riders records where user_id references a Deactivated_User
5. WHEN the System loads cook advance data, THE Data_Filter SHALL exclude cook_advances where given_by references a Deactivated_User
6. WHEN the System loads cook purchase data, THE Data_Filter SHALL exclude cook_purchases where created_by references a Deactivated_User
7. WHEN the System loads contribution payment data, THE Data_Filter SHALL exclude contribution_payments where user_id references a Deactivated_User
8. WHEN the System calculates monthly balance summaries, THE Balance_Calculation SHALL exclude Deactivated_User profiles from the computation
9. WHEN the System displays user lists outside the admin page, THE User_List SHALL exclude Deactivated_User profiles

### Requirement 2: Admin Visibility Control

**User Story:** As an admin, I want to toggle visibility of deactivated users' data, so that I can view complete historical records when needed.

#### Acceptance Criteria

1. WHEN an Admin views the Dashboard page, THE System SHALL display a Visibility_Toggle control
2. WHEN an Admin views the Expenses page, THE System SHALL display a Visibility_Toggle control
3. WHEN an Admin views the Weekend Expenses page, THE System SHALL display a Visibility_Toggle control
4. WHEN an Admin views the Rides page, THE System SHALL display a Visibility_Toggle control
5. WHEN an Admin views the Cook page, THE System SHALL display a Visibility_Toggle control
6. WHEN an Admin views the Contributions page, THE System SHALL display a Visibility_Toggle control
7. WHEN the Visibility_Toggle is set to show all data, THE Data_Filter SHALL include both Active_User and Deactivated_User records
8. WHEN the Visibility_Toggle is set to hide deactivated data, THE Data_Filter SHALL exclude Deactivated_User records
9. THE Visibility_Toggle SHALL default to hide deactivated data state

### Requirement 3: Visual Distinction

**User Story:** As an admin viewing historical data, I want deactivated users' records visually distinguished, so that I can easily identify which data belongs to inactive members.

#### Acceptance Criteria

1. WHEN the System displays an expense created by a Deactivated_User, THE System SHALL render the creator name with reduced opacity
2. WHEN the System displays a ride involving a Deactivated_User, THE System SHALL render the Deactivated_User name with reduced opacity
3. WHEN the System displays cook data from a Deactivated_User, THE System SHALL render the Deactivated_User name with reduced opacity
4. WHEN the System displays a contribution payment for a Deactivated_User, THE System SHALL render the Deactivated_User name with reduced opacity
5. WHEN the System displays a Deactivated_User in a participant list, THE System SHALL append a "(Deactivated)" label to the name

### Requirement 4: Preference Persistence

**User Story:** As an admin, I want my visibility preference remembered across sessions, so that I do not need to reconfigure the toggle every time I use the application.

#### Acceptance Criteria

1. WHEN an Admin changes the Visibility_Toggle state, THE System SHALL store the new state in User_Preference
2. WHEN an Admin loads a page with a Visibility_Toggle, THE System SHALL retrieve the state from User_Preference
3. WHEN an Admin loads a page with a Visibility_Toggle and no User_Preference exists, THE System SHALL default to hide deactivated data state
4. THE User_Preference SHALL persist across browser sessions
5. THE User_Preference SHALL be scoped per browser and device

### Requirement 5: Admin Page Exception

**User Story:** As an admin, I want to always see all users on the Admin page, so that I can manage both active and deactivated accounts.

#### Acceptance Criteria

1. WHEN an Admin views the Admin page user list, THE System SHALL display both Active_User and Deactivated_User profiles
2. WHEN an Admin views the Admin page, THE System SHALL NOT display a Visibility_Toggle control
3. WHEN the System displays a Deactivated_User on the Admin page, THE System SHALL render the profile with visual distinction
4. WHEN the System displays a Deactivated_User on the Admin page, THE System SHALL display the current is_active status

### Requirement 6: Query Performance

**User Story:** As a user, I want data filtering to perform efficiently, so that page load times remain fast.

#### Acceptance Criteria

1. WHEN the Data_Filter applies to expense queries, THE System SHALL complete the query within 500 milliseconds
2. WHEN the Data_Filter applies to ride queries, THE System SHALL complete the query within 500 milliseconds
3. WHEN the Data_Filter applies to cook queries, THE System SHALL complete the query within 500 milliseconds
4. WHEN the Data_Filter applies to contribution queries, THE System SHALL complete the query within 500 milliseconds
5. THE Data_Filter SHALL apply filtering at the database query level rather than in client-side JavaScript

### Requirement 7: Data Integrity

**User Story:** As an admin, I want filtering to preserve data integrity, so that no records are permanently deleted or corrupted.

#### Acceptance Criteria

1. WHEN the Data_Filter excludes Deactivated_User records, THE System SHALL NOT modify the database records
2. WHEN an Admin toggles visibility to show all data, THE System SHALL display the complete unmodified Historical_Data
3. WHEN the System calculates balance summaries with deactivated data hidden, THE System SHALL NOT alter stored contribution_payments records
4. WHEN the System filters expense participants, THE System SHALL NOT modify expense_participants table records

### Requirement 8: Toggle Control Design

**User Story:** As an admin, I want the visibility toggle clearly labeled and accessible, so that I can easily understand and use the control.

#### Acceptance Criteria

1. THE Visibility_Toggle SHALL display the label "Show Deactivated Users" when in hide state
2. THE Visibility_Toggle SHALL display the label "Hide Deactivated Users" when in show state
3. THE Visibility_Toggle SHALL use a Switch component for the control
4. THE Visibility_Toggle SHALL be positioned near the page header or filter controls
5. THE Visibility_Toggle SHALL be visible on both mobile and desktop layouts
6. WHEN a non-admin user views pages with data, THE System SHALL NOT display the Visibility_Toggle control

### Requirement 9: Calculation Accuracy

**User Story:** As a flatmate, I want balance calculations to accurately reflect only active members, so that expense splits are fair and correct.

#### Acceptance Criteria

1. WHEN the System calculates per-member fixed expense share with deactivated data hidden, THE Balance_Calculation SHALL divide by the count of Active_User profiles only
2. WHEN the System calculates weekend expense splits with deactivated data hidden, THE Balance_Calculation SHALL include only Active_User participants
3. WHEN the System displays monthly summary totals with deactivated data hidden, THE System SHALL sum only expenses from Active_User creators
4. WHEN an Admin enables show all data mode, THE Balance_Calculation SHALL include both Active_User and Deactivated_User data in all computations

### Requirement 10: Ride Debt Calculation

**User Story:** As a flatmate, I want ride debt calculations to exclude deactivated users, so that I only see amounts owed to and from current residents.

#### Acceptance Criteria

1. WHEN the System calculates ride debts with deactivated data hidden, THE System SHALL exclude rides where paid_by references a Deactivated_User
2. WHEN the System calculates ride debts with deactivated data hidden, THE System SHALL exclude ride_riders where user_id references a Deactivated_User
3. WHEN the System displays ride debt summaries, THE System SHALL NOT show Deactivated_User names in the debt list
4. WHEN an Admin enables show all data mode, THE System SHALL include Deactivated_User data in ride debt calculations

### Requirement 11: Cook Ledger Filtering

**User Story:** As a flatmate viewing the cook ledger, I want to see only advances and purchases from active members, so that the current balance is accurate.

#### Acceptance Criteria

1. WHEN the System displays cook advances with deactivated data hidden, THE System SHALL exclude advances where given_by references a Deactivated_User
2. WHEN the System displays cook purchases with deactivated data hidden, THE System SHALL exclude purchases where created_by references a Deactivated_User
3. WHEN the System calculates cook balance with deactivated data hidden, THE System SHALL sum only advances and purchases from Active_User profiles
4. WHEN an Admin enables show all data mode, THE System SHALL display all cook advances and purchases including Deactivated_User records

### Requirement 12: Announcement and Activity Log Filtering

**User Story:** As a flatmate, I want announcements and activity logs from deactivated users hidden by default, so that the feed shows only current resident activity.

#### Acceptance Criteria

1. WHEN the System loads announcements with deactivated data hidden, THE System SHALL exclude announcements where created_by references a Deactivated_User
2. WHEN the System loads activity logs with deactivated data hidden, THE System SHALL exclude activity_log entries where user_id references a Deactivated_User
3. WHEN an Admin enables show all data mode on pages displaying announcements, THE System SHALL include announcements from Deactivated_User profiles
4. WHEN an Admin enables show all data mode on pages displaying activity logs, THE System SHALL include activity_log entries from Deactivated_User profiles

### Requirement 13: User Selection Dropdowns

**User Story:** As a user creating an expense or ride, I want user selection dropdowns to show only active members, so that I cannot accidentally assign expenses to deactivated users.

#### Acceptance Criteria

1. WHEN the System displays a user selection dropdown for expense participants, THE System SHALL include only Active_User profiles
2. WHEN the System displays a user selection dropdown for ride riders, THE System SHALL include only Active_User profiles
3. WHEN the System displays a user selection dropdown for cook advance giver, THE System SHALL include only Active_User profiles
4. WHEN the System displays a user selection dropdown for contribution payment user, THE System SHALL include only Active_User profiles
5. THE System SHALL apply this filtering regardless of admin status or Visibility_Toggle state

### Requirement 14: Flat View Filtering

**User Story:** As a flatmate viewing the flat layout, I want to see only active residents assigned to beds, so that the visualization reflects current occupancy.

#### Acceptance Criteria

1. WHEN the System displays the flat layout view with deactivated data hidden, THE System SHALL exclude bed assignments where user_id references a Deactivated_User
2. WHEN the System displays user avatars on the flat layout, THE System SHALL render only Active_User avatars
3. WHEN an Admin enables show all data mode on the flat view page, THE System SHALL display bed assignments for both Active_User and Deactivated_User profiles
4. WHEN the System displays a bed assigned to a Deactivated_User in show all mode, THE System SHALL render the avatar with reduced opacity

### Requirement 15: Error Handling

**User Story:** As a user, I want the application to handle filtering errors gracefully, so that I can still access data if the filter fails.

#### Acceptance Criteria

1. WHEN the Data_Filter encounters a database query error, THE System SHALL log the error to the console
2. WHEN the Data_Filter encounters a database query error, THE System SHALL display an error message to the user
3. WHEN the User_Preference storage fails to save, THE System SHALL continue operating with the current toggle state
4. WHEN the User_Preference storage fails to retrieve, THE System SHALL default to hide deactivated data state
5. IF the Data_Filter fails to apply, THEN THE System SHALL display unfiltered data rather than showing no data

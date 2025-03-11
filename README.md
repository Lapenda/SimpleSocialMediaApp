# SimpleSocialNetworkApp
A simple social network app made with Angular, Node.js/Express.js and MongoDB Atlas database

Project Description
This is a simple social networking application where users can create posts, comment on them, and like them. Each author has the ability to edit or delete their own profile, posts, or comments. The application also includes an admin role with extended privileges: admins can edit or delete any user's comment and have access to an Admin Panel page. 
In the Admin Panel, admins can:

View a graph displaying the number of registered users and posts published per day.
Add or remove admin roles for any user.
Permanently delete any user’s account.

Key Features
Messaging System: Implemented a messaging feature with a "seen" functionality, allowing the sender to see when their message has been read by the recipient. In the conversation view, outgoing messages appear on the right with a blue background, while incoming messages are on the left with a white background.

Search Functionality: Includes a search bar that filters all users via a custom pipe. For clarity, only the first 10 users are displayed on the side, mimicking a "Suggested Friends" feed. In the Admin Panel, only the first 5 users are shown by default, but all existing users can be found by entering their username.

User Profiles: Any user’s profile can be viewed if they have published posts.

Technical Details
Database: The application uses MongoDB Atlas as an online database. No database export is provided since it’s hosted online, and access is enabled from all IP addresses.

JanaSeva2026: A Unified Digital Government Service Portal for Citizen Application, Verification, and Tracking
This title reflects the core purpose of the project:
•	JanaSeva represents public service delivery.
•	Unified Digital Government Service Portal shows that multiple services are integrated into one system.
•	Citizen Application, Verification, and Tracking highlights the three main functions of the platform:
application submission, identity/authentication support, and status monitoring.

1.2 PROJECT DESCRIPTION
JanaSeva2026 is a web-based government service management system developed to simplify the delivery of citizen-centric services through a single online platform. The project consists of a frontend, backend, and database working together as one integrated application.
The frontend is built using HTML, CSS, and JavaScript. It provides separate user and admin interfaces. Citizens can create accounts, log in, fill out service-specific forms, upload required documents, and view their submitted applications. The admin side allows authorized staff to log in, view application summaries, inspect detailed records, and approve or reject requests based on review.
The backend is developed using Node.js and Express.js. It handles routing, user registration, login validation, OTP generation and verification, application submission, admin session management, and face-verification APIs. It also serves the frontend pages and connects them with the database.
The database is MySQL, which stores user details, admin details, OTP codes, face verification data, application history, and service-specific application records. Separate tables are maintained for different services such as Aadhaar, PAN, passport, voter ID, birth certificate, driving license, ration card, and caste-income certificate. This improves organization and makes data retrieval easier.

Some notable project features are:
•	User registration and login.
•	OTP-based authentication support.
•	Face verification support for stronger identity confirmation.
•	Separate admin login and application review system.
•	Multiple government service forms in one portal.
•	Application history and status tracking.
•	PWA support for installable and partially offline usage.
•	News/help pages for additional citizen support.
In short, the project aims to create a secure, scalable, and easy-to-use digital platform for government service access.

2. LITERATURE SURVEY
A literature survey studies the existing practices, problems, and technological approaches relevant to the project. In the area of e-governance, many systems have already been developed to digitize public services. These systems generally focus on online form submission, citizen databases, service delivery automation, and application tracking.
Traditional e-governance systems were mainly created to reduce paper usage and improve office efficiency. Later, web portals were introduced to allow citizens to download forms, check notices, or submit limited online requests. More recent systems include integrated portals that combine authentication, online payments, document uploads, and workflow management. With the growth of digital identity systems and secure online verification, governments are increasingly moving toward smart service platforms that support remote access and digital trust.
Research and implementation trends in this field highlight the importance of:
•	Centralized access to multiple services.
•	Secure user authentication.
•	Database-driven application processing.
•	Role-based access for citizens and administrators.
•	Real-time or near real-time application status updates.
•	Mobile-friendly and low-cost web access.
•	Biometric or face-based verification for added security.
The JanaSeva2026 project aligns with these developments by combining online application services, OTP-based security, admin verification, database storage, and face-verification support into one system. It reflects the broader movement from manual governance to digital governance.

2.1 EXISTING SYSTEM AND PROPOSED SYSTEM
Existing System
In the existing system, government service applications are often handled manually or through partially digital processes. Citizens may need to:
•	Visit separate offices for different services.
•	Collect and fill physical forms.
•	Submit photocopies of supporting documents repeatedly.
•	Wait in queues for verification and approval.
•	Make repeated visits to check application progress.
•	Face delays due to document mismatch, lost files, or manual errors.
Even where online systems exist, many are limited to one department or one service only. This creates fragmentation. A citizen may have to use different websites for Aadhaar-related services, voter services, certificate services, and other public applications. Many such systems also lack strong verification methods and proper admin dashboards, making the process less efficient.
The drawbacks of the existing system include:
•	Time-consuming manual work.
•	Lack of a single integrated platform.
•	Poor transparency in application tracking.
•	Increased chance of human error.
•	Repetitive document submission.
•	Limited accessibility for citizens in remote areas.
•	Weak coordination between applicants and officials.

Proposed System
The proposed system is JanaSeva2026, a unified online portal that integrates multiple public services into a single web application. Instead of using separate offices or portals, users can access one platform to register, verify identity, apply for services, and track progress.
In this system:
•	Users create an account and log in securely.
•	OTP verification is used during registration/login flows.
•	Face-verification features increase trust and identity reliability.
•	Multiple services are available under one portal.
•	Data is stored in a structured MySQL database.
•	Admin users can review, verify, approve, or reject applications.
•	Application history is available for tracking and transparency.
•	PWA support improves usability on mobile devices and low-connectivity conditions.
Advantages of the proposed system are:
•	Reduced paperwork and manual effort.
•	Faster service request submission.
•	Centralized access to multiple services.
•	Better transparency and record management.
•	Improved security through OTP and face verification.
•	Easier monitoring by administrative staff.
•	Better user convenience and accessibility.
Therefore, the proposed system is more efficient, scalable, secure, and citizen-friendly than the existing approach.

2.2 TOOLS AND TECHNOLOGY USED
The successful implementation of JanaSeva2026 depends on a combination of frontend, backend, database, and supporting technologies. Each tool has a specific role in the project.
1.HTML
HTML is used to create the structure of web pages such as login, registration, home, help, admin pages, and service application forms. It defines the layout and content visible to users.
2.CSS
CSS is used to style the pages and improve visual presentation. It helps create a clean user interface, readable forms, buttons, layouts, and responsive page sections for better usability.
3.JavaScript
JavaScript is used on the client side for form handling, dynamic interactions, file processing, 
validation, and integration with backend APIs. It also supports features such as PWA behavior and face-verification interactions.
4.Node.js
Node.js is used as the runtime environment for the backend. It allows JavaScript to run on the server and helps build a fast, event-driven web application.
5.Express.js
Express.js is the backend framework used to define routes, manage requests and responses, serve static frontend files, and build APIs such as login, registration, application submission, admin dashboard access, OTP verification, and face verification.
6.MySQL
MySQL is used as the relational database management system. It stores structured data including users, admins, OTP records, face samples, application history, and all service application details.
7.mysql2
The mysql2 package is used to connect the Node.js backend to the MySQL database. It supports query execution and connection pooling for efficient database operations.
8. bcrypt
bcrypt is used for password hashing. Instead of storing passwords in plain text, the project stores hashed passwords, improving security.
9. body-parser
body-parser is used to read JSON and form data sent from the frontend to the backend.
10. cors
cors enables Cross-Origin Resource Sharing, allowing the frontend and backend to communicate properly even if served from different local origins during testing.
11.multer
multer is used to handle file uploads such as user documents and face images.
12. dotenv
dotenv is used to manage environment variables such as database settings, admin defaults, and external service credentials.
13. AWS Rekognition
AWS Rekognition is used for face detection and face comparison features. It strengthens identity verification and improves the trust level of user/admin authentication flows.
14. Progressive Web App Technologies
15. The project uses:
•	manifest.webmanifest
•	service worker
•	install prompt support
•	offline fallback pages
These technologies allow the portal to behave like an installable web app and offer better performance and limited offline access.Overall, the technology stack is modern, practical, and suitable for building a web-based e-governance platform.

2.3 HARDWARE AND SOFTWARE REQUIREMENTS
The project requires a minimum hardware and software setup for development, testing, and deployment.
Hardware Requirements
For development and normal execution, the following hardware is sufficient:
•	Processor: Intel Core i3 or above
•	RAM: Minimum 4 GB, recommended 8 GB
•	Storage: Minimum 20 GB free disk space
•	Display: Standard monitor with internet browser support
•	Network: Internet connection for package installation, cloud API usage, and online service access
•	Camera/Webcam: Required for face-verification features

Software Requirements
Operating System
•	Windows 10/11, Linux, or macOS
•	The current project setup is suitable for Windows-based local development as well.
Development Tools
•	Visual Studio Code or any code editor
•	Command Prompt / PowerShell / Terminal
•	Web browser such as Google Chrome, Microsoft Edge, or Firefox
Runtime and Server Software
•	Node.js version 14 or above
•	npm for package management
•	Express.js backend server
Database Software
•	MySQL Server
•	MySQL Workbench or command-line client for schema execution and database management
Libraries/Packages Used
•	express
•	mysql2
•	bcrypt
•	body-parser
•	cors
•	multer
•	dotenv
•	aws-sdk
Optional External Service Requirements
•	AWS credentials for Rekognition-based face verification
•	SMS OTP provider configuration for production OTP sending

Browser Support
•	Any modern browser supporting JavaScript and service workers
Eg: Chrome, FireFox, MicrosoftEdge etc.

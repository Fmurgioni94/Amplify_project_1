# Learning Roadmap Generator

A web application that helps users create personalized learning roadmaps based on their preferences and coursework requirements.

## Features

- **Personalized Learning Roadmaps**: Generate customized learning paths based on user preferences using CheshireCat AI, a framework to customise agents
- **Project Organization**: Split the subtasks between different coworkers using a genetic algorithm 
- **Saved Roadmaps**: Save and manage your learning roadmaps for future reference
- **Real-time Updates**: WebSocket-based communication for instant roadmap generation
- **User Authentication**: Secure login and signup functionality using AWS Amplify

## Tech Stack

- **Frontend**: React, TypeScript
- **UI Components**: AWS Amplify UI
- **Authentication**: AWS Amplify Auth
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS account with Amplify configured

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [project-directory]
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure AWS Amplify:
```bash
amplify init
amplify push
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

## Project Structure

- `src/pages/`: Main page components
  - `home.tsx`: Home page with roadmap generation
  - `saved_roadmaps.tsx`: Saved roadmaps management
  - `courseworkOrganiser.tsx`: Coursework organization
- `src/components/`: Reusable components
  - `Navbar.tsx`: Navigation bar
  - `Modal.tsx`: Modal component
  - `roadmap.tsx`: Roadmap visualization
- `src/App.tsx`: Main application component with routing

## Usage

1. **Home Page**
   - Enter your learning preferences
   - Generate a personalized roadmap
   - Save roadmaps for future reference

2. **Coursework Organizer**
   - Select from predefined coursework
   - Generate specific coursework roadmaps
   - Manage coursework progress

3. **Saved Roadmaps**
   - View all saved roadmaps
   - Edit roadmap titles
   - Delete unwanted roadmaps

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

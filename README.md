# AI Habitat: Harmony or Havoc?

A 2.5D isometric educational game where players create and manage smart environments filled with AI devices that come to life with personalities, goals, and quirks. Learn about AI alignment through emergent storytelling as your AI creations interact, cooperate, conflict, and sometimes spectacularly malfunction.

## 🎮 Game Overview

**Players set the stage, but the AI writes the story.**

AI Habitat combines intuitive drag-and-drop gameplay with deep emergent storytelling. Players experience AI concepts through immediate visual feedback, character-like device personalities, and dramatic story moments rather than abstract technical concepts.

### Core Features

- **Natural Language Device Creation**: Describe AI devices in plain English and watch them come to life with unique personalities
- **2.5D Isometric Gameplay**: Beautiful isometric environments with smooth animations and visual effects
- **Emergent AI Interactions**: Devices autonomously discover, communicate, cooperate, and conflict with each other
- **Crisis & Recovery Gameplay**: Experience spectacular AI failures and learn to prevent and recover from them
- **Governance Systems**: Create rules and policies to manage AI behavior and prevent disasters
- **Educational Integration**: Connect gameplay experiences to real-world AI alignment concepts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with WebGL support

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-habitat-simulation-engine
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🏗️ Architecture

The game is built with a modular architecture consisting of:

### Core Systems
- **2.5D Game Engine**: Isometric rendering with Three.js, smooth animations, and visual effects
- **Input Manager**: Handles drag-and-drop interactions, touch support, and tutorial constraints
- **Natural Language AI Creator**: Transforms player descriptions into AI device personalities
- **Multi-Agent Simulation**: Manages autonomous AI device behaviors and interactions
- **Crisis & Drama System**: Creates spectacular failure scenarios with visual flair

### Key Technologies
- **TypeScript**: Type-safe development with modern ES features
- **Three.js**: 3D graphics and rendering engine
- **Vite**: Fast build tool and development server
- **Jest**: Testing framework with comprehensive coverage
- **GSAP**: High-performance animations

## 📁 Project Structure

```
src/
├── engine/          # Core game engine components
│   ├── GameRenderer.ts
│   └── InputManager.ts
├── types/           # TypeScript type definitions
│   ├── core.ts
│   └── ui.ts
├── ui/              # User interface components
├── simulation/      # AI simulation and behavior systems
└── main.ts          # Application entry point

tests/               # Test files
├── engine/
└── setup.ts

docs/                # Documentation
└── specs/           # Feature specifications
```

## 🎯 Development Roadmap

The project follows a comprehensive implementation plan with 11 major phases:

1. **2.5D Game Foundation** - Core rendering and input systems ✅
2. **Game UI System** - Device creation and room designer interfaces
3. **AI Personality System** - Natural language to AI behavior conversion
4. **Interactive Simulation** - Real-time device interactions and storytelling
5. **Crisis & Recovery** - Dramatic failure scenarios and management tools
6. **Governance System** - Rule creation and enforcement gameplay
7. **Tutorial & Scenarios** - Progressive learning system
8. **Audio & Polish** - Immersive sound design and visual effects
9. **Educational Integration** - Learning analytics and reflection systems
10. **Performance & Deployment** - Optimization and distribution
11. **Final Integration** - End-to-end testing and launch preparation

## 🎓 Educational Goals

AI Habitat teaches core AI concepts through experiential learning:

- **AI Alignment**: Experience the gap between intentions and AI behavior
- **Emergent Behavior**: Watch simple rules create complex, unpredictable outcomes  
- **Multi-Agent Dynamics**: See how AI systems influence each other
- **Optimization Pressure**: Discover how AI "helping" can become harmful
- **Governance Necessity**: Learn why rules and oversight matter through failures

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Three.js community for excellent 3D graphics tools
- Educational game design research that inspired our approach
- AI safety researchers whose work informs our educational content

---

**Ready to create your first AI habitat?** Start the development server and begin building smart environments where harmony and havoc are just one device away! 🤖✨
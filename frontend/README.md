# Comet DevOps Platform - Frontend

A modern, comprehensive frontend application for the Comet DevOps Platform built with Next.js 14, React 18, and TypeScript.

## 🚀 Features

### Core Functionality
- **Dashboard Analytics**: Real-time metrics, pipeline status, and system monitoring
- **Pipeline Management**: Complete CI/CD pipeline visualization and control
- **Testing Interface**: Test suite management, results visualization, and coverage tracking
- **Deployment Monitoring**: Environment status, deployment history, and health monitoring
- **System Monitoring**: Performance metrics, alerts, and system health dashboards
- **User Authentication**: Secure login/register with form validation
- **Settings Management**: User profile, notifications, integrations, and team management

### Technical Features
- **Modern Design System**: Custom UI components with Tailwind CSS
- **Responsive Design**: Mobile-first approach with collapsible navigation
- **Dark Mode Support**: Complete light/dark theme implementation
- **Type Safety**: Full TypeScript coverage with comprehensive type definitions
- **Component Architecture**: Reusable components with class-variance-authority patterns
- **Real-time Updates**: WebSocket-ready architecture for live data
- **Accessibility**: WCAG compliant components and navigation

## 🛠 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Custom component library inspired by shadcn/ui
- **Icons**: Heroicons for consistent iconography
- **State Management**: React hooks and context (ready for Zustand/Redux integration)
- **Form Handling**: React forms with validation
- **Routing**: Next.js App Router with dynamic routing

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── dashboard/         # Dashboard page
│   ├── pipelines/         # Pipeline management
│   ├── testing/           # Testing interface
│   ├── deployments/       # Deployment monitoring
│   ├── monitoring/        # System monitoring
│   ├── settings/          # Settings management
│   ├── layout.tsx         # Root layout with sidebar
│   └── page.tsx           # Root page (redirects to dashboard)
├── components/            # Reusable components
│   ├── ui/               # Core UI components
│   │   ├── button.tsx    # Button component with variants
│   │   ├── card.tsx      # Card container components
│   │   ├── badge.tsx     # Status badges
│   │   └── progress.tsx  # Progress indicators
│   └── layout/           # Layout components
│       └── sidebar.tsx   # Navigation sidebar
├── lib/                  # Utility libraries
│   └── utils.ts         # Common utility functions
├── styles/              # Global styles
│   └── globals.css      # Tailwind config and custom styles
└── types/               # TypeScript type definitions
    └── index.ts         # All application types
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue variants for main actions and branding
- **Success**: Green for positive states and success indicators
- **Warning**: Yellow/Orange for warnings and caution states
- **Destructive**: Red for errors and dangerous actions
- **Muted**: Gray variants for secondary content

### Components
- **Button**: Multiple variants (default, destructive, outline, success, warning)
- **Card**: Container components with header, content, and footer sections
- **Badge**: Status indicators with color-coded variants
- **Progress**: Visual progress indicators for pipelines and metrics
- **Navigation**: Responsive sidebar with hierarchical structure

### Typography
- **Headings**: Clear hierarchy with proper sizing and weights
- **Body Text**: Readable typography with proper contrast
- **Code**: Monospace font for technical content

## 🔧 Development

### Prerequisites
- Node.js 18.x or higher
- npm, yarn, or pnpm package manager

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run type-check # Run TypeScript compiler
```

## 📱 Pages & Features

### Authentication
- **Login Page** (`/auth/login`)
  - Form validation with real-time error feedback
  - Password visibility toggle
  - Demo credentials display
  - Remember me functionality
  - Responsive design with modern UI

- **Register Page** (`/auth/register`)
  - Multi-step form with validation
  - Password strength indicator
  - Terms agreement checkbox
  - Real-time form validation
  - Password confirmation matching

### Dashboard (`/dashboard`)
- **Key Metrics**: Success rates, build times, deployment status
- **Pipeline Overview**: Recent pipeline runs with status indicators
- **Activity Feed**: Recent system activities and notifications
- **Quick Actions**: Fast access to common operations
- **Real-time Updates**: Live status updates and metrics

### Pipeline Management (`/pipelines`)
- **Pipeline List**: All pipelines with status and metadata
- **Pipeline Cards**: Visual pipeline representation
- **Filtering**: Filter by status, branch, environment
- **Pipeline Details**: Detailed view with steps and logs
- **Actions**: Run, pause, cancel pipeline operations

### Testing Interface (`/testing`)
- **Test Suites**: Organized test suite management
- **Test Results**: Detailed pass/fail statistics
- **Coverage Reports**: Code coverage visualization
- **Test Details**: Individual test case results
- **Filtering**: Filter by test type and status

### Deployment Monitoring (`/deployments`)
- **Environment Overview**: Status of all deployment environments
- **Deployment History**: Complete deployment timeline
- **Health Monitoring**: Real-time health status and metrics
- **Rollback Capabilities**: Easy rollback to previous versions
- **Performance Metrics**: CPU, memory, and request metrics

### System Monitoring (`/monitoring`)
- **Performance Metrics**: Real-time system performance data
- **Alert Management**: Active alerts and notifications
- **Health Dashboards**: System component health status
- **Analytics**: Performance trends and analytics
- **Custom Metrics**: Configurable monitoring dashboards

### Settings (`/settings`)
- **Profile Management**: User profile and preferences
- **Notification Settings**: Configurable notification preferences
- **Integration Management**: External tool integrations
- **Security Settings**: Password, 2FA, API keys
- **Team Management**: Team member and permission management

## 🔗 Integration Points

### Backend API Integration
- RESTful API endpoints for all data operations
- WebSocket connections for real-time updates
- Authentication token management
- Error handling and retry logic

### External Services
- **Git Providers**: GitHub, GitLab, Bitbucket integration
- **CI/CD Tools**: Jenkins, GitHub Actions, GitLab CI
- **Monitoring**: Prometheus, Grafana integration
- **Communication**: Slack, Teams notifications
- **Issue Tracking**: JIRA, Linear integration

## 🔒 Security Features

- **Authentication**: Secure login with token-based auth
- **Authorization**: Role-based access control (RBAC)
- **Form Validation**: Client and server-side validation
- **XSS Protection**: Sanitized inputs and outputs
- **CSRF Protection**: Cross-site request forgery prevention

## 📊 Performance Optimization

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component optimization
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Lazy Loading**: Component and route-based lazy loading
- **Caching**: Static and dynamic content caching

## 🌙 Accessibility

- **WCAG Compliance**: Meets WCAG 2.1 AA standards
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: High contrast ratios for readability
- **Focus Management**: Proper focus handling and indicators

## 🚀 Deployment

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_NAME=Comet DevOps
```

### Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is part of the Comet DevOps Platform and is proprietary software.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and API references

---

**Comet DevOps Platform Frontend** - Built with ❤️ using Next.js, React, and TypeScript
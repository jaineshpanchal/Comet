# 🎨 UI/UX Design Guidelines - Comet DevOps Platform

## 🎯 Design Philosophy

Comet follows Apple's design principles combined with modern DevOps workflow needs, creating an interface that's powerful yet intuitive, professional yet approachable.

### Core Principles

1. **Clarity Over Cleverness** - Every element serves a purpose
2. **Consistency in Interaction** - Similar actions work the same way
3. **Depth Through Layers** - Progressive disclosure of complexity
4. **Deference to Content** - UI supports, never overshadows content
5. **Accessibility First** - Inclusive design for all users

## 🎨 Visual Design System

### Color Palette

```css
/* Primary Colors */
--comet-blue: #007AFF;           /* Primary brand color */
--comet-blue-dark: #005299;      /* Dark variant */
--comet-blue-light: #B3D7FF;     /* Light variant */

/* Semantic Colors */
--success: #34C759;              /* Success states, passing tests */
--warning: #FF9500;              /* Warnings, pending states */
--error: #FF3B30;                /* Errors, failed tests */
--info: #5AC8FA;                 /* Information, notifications */

/* Neutral Colors */
--gray-50: #F9FAFB;              /* Lightest backgrounds */
--gray-100: #F3F4F6;             /* Card backgrounds */
--gray-200: #E5E7EB;             /* Borders, dividers */
--gray-300: #D1D5DB;             /* Disabled states */
--gray-400: #9CA3AF;             /* Placeholder text */
--gray-500: #6B7280;             /* Secondary text */
--gray-600: #4B5563;             /* Primary text (light mode) */
--gray-700: #374151;             /* Headings */
--gray-800: #1F2937;             /* Dark text */
--gray-900: #111827;             /* Darkest text */

/* Dark Mode Colors */
--dark-bg: #000000;              /* Pure black background */
--dark-bg-secondary: #1C1C1E;    /* Secondary backgrounds */
--dark-bg-tertiary: #2C2C2E;     /* Tertiary backgrounds */
--dark-text-primary: #FFFFFF;    /* Primary text (dark mode) */
--dark-text-secondary: #EBEBF5;  /* Secondary text (dark mode) */
--dark-text-tertiary: #EBEBF599; /* Tertiary text (dark mode) */
```

### Typography Scale

```css
/* Font Families */
--font-sans: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px - Small labels */
--text-sm: 0.875rem;    /* 14px - Body text, captions */
--text-base: 1rem;      /* 16px - Default body text */
--text-lg: 1.125rem;    /* 18px - Large body text */
--text-xl: 1.25rem;     /* 20px - Small headings */
--text-2xl: 1.5rem;     /* 24px - Medium headings */
--text-3xl: 1.875rem;   /* 30px - Large headings */
--text-4xl: 2.25rem;    /* 36px - Extra large headings */
--text-5xl: 3rem;       /* 48px - Display text */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
/* Spacing Scale (based on 4px grid) */
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
```

### Border Radius

```css
--radius-sm: 0.125rem;   /* 2px - Small elements */
--radius-base: 0.25rem;  /* 4px - Default radius */
--radius-md: 0.375rem;   /* 6px - Medium elements */
--radius-lg: 0.5rem;     /* 8px - Large elements */
--radius-xl: 0.75rem;    /* 12px - Extra large */
--radius-2xl: 1rem;      /* 16px - Cards, modals */
--radius-full: 9999px;   /* Fully rounded */
```

### Shadows & Elevation

```css
/* Shadow System */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Colored Shadows for Interactive Elements */
--shadow-blue: 0 4px 14px 0 rgba(0, 122, 255, 0.25);
--shadow-success: 0 4px 14px 0 rgba(52, 199, 89, 0.25);
--shadow-error: 0 4px 14px 0 rgba(255, 59, 48, 0.25);
```

## 🧩 Component Design Patterns

### Buttons

```tsx
// Primary Button
<Button variant="primary" size="medium">
  Execute Pipeline
</Button>

// Secondary Button
<Button variant="secondary" size="medium">
  Cancel
</Button>

// Destructive Button
<Button variant="destructive" size="medium">
  Delete Pipeline
</Button>

// Ghost Button
<Button variant="ghost" size="small">
  View Logs
</Button>
```

**Button States:**
- Default: Clean, clear call-to-action
- Hover: Slight elevation and color intensity increase
- Active: Pressed state with inset shadow
- Disabled: Reduced opacity with no interaction
- Loading: Spinner with reduced opacity

### Cards & Containers

```tsx
// Pipeline Card
<Card className="pipeline-card">
  <CardHeader>
    <div className="flex items-center gap-3">
      <StatusIndicator status="running" />
      <h3>Frontend Build Pipeline</h3>
      <Badge variant="success">Main</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <ProgressBar value={65} label="Build Progress" />
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Duration" value="2m 15s" />
        <Metric label="Tests" value="127 passed" />
        <Metric label="Coverage" value="94%" />
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <div className="flex justify-between">
      <Text variant="secondary">Started 3 minutes ago</Text>
      <ButtonGroup>
        <Button variant="ghost" size="small">View Logs</Button>
        <Button variant="ghost" size="small">Stop Build</Button>
      </ButtonGroup>
    </div>
  </CardFooter>
</Card>
```

### Navigation Patterns

```tsx
// Sidebar Navigation
<Sidebar>
  <SidebarHeader>
    <Logo />
    <ProjectSelector currentProject="E-commerce Platform" />
  </SidebarHeader>
  
  <SidebarNav>
    <NavItem icon={DashboardIcon} label="Dashboard" active />
    <NavItem icon={PipelineIcon} label="Pipelines" />
    <NavItem icon={TestingIcon} label="Testing" />
    <NavItem icon={DeploymentIcon} label="Deployments" />
    <NavItem icon={MonitoringIcon} label="Monitoring" />
    
    <NavSection title="Integrations">
      <NavItem icon={GitHubIcon} label="GitHub" />
      <NavItem icon={JiraIcon} label="JIRA" />
      <NavItem icon={SlackIcon} label="Slack" />
    </NavSection>
  </SidebarNav>
  
  <SidebarFooter>
    <UserMenu />
    <ThemeToggle />
  </SidebarFooter>
</Sidebar>
```

### Data Visualization

```tsx
// Status Dashboard
<Dashboard>
  <DashboardHeader>
    <h1>DevOps Dashboard</h1>
    <TimeRangeSelector />
  </DashboardHeader>
  
  <DashboardGrid>
    <MetricCard
      title="Pipeline Success Rate"
      value="98.5%"
      trend="+2.1%"
      chart={<SuccessRateChart />}
    />
    
    <MetricCard
      title="Average Build Time"
      value="4m 32s"
      trend="-15s"
      chart={<BuildTimeChart />}
    />
    
    <MetricCard
      title="Test Coverage"
      value="94.2%"
      trend="+1.3%"
      chart={<CoverageChart />}
    />
    
    <MetricCard
      title="Deployment Frequency"
      value="12/day"
      trend="+3"
      chart={<DeploymentChart />}
    />
  </DashboardGrid>
  
  <ActivityFeed>
    <FeedItem
      type="success"
      title="Pipeline completed successfully"
      subtitle="frontend-build-pipeline"
      timestamp="2 minutes ago"
    />
    <FeedItem
      type="warning"
      title="Test coverage below threshold"
      subtitle="backend-api-tests"
      timestamp="5 minutes ago"
    />
  </ActivityFeed>
</Dashboard>
```

## 📱 Responsive Design

### Breakpoint System

```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Mobile Adaptations

**Navigation:**
- Collapsible sidebar becomes bottom navigation
- Search becomes a dedicated page
- Context menus become action sheets

**Cards:**
- Stack vertically with full width
- Reduce padding and font sizes
- Hide secondary information

**Tables:**
- Horizontal scroll for wide tables
- Card view for important data
- Collapsible columns

## ⚡ Animation & Micro-interactions

### Animation Principles

```css
/* Timing Functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Duration Scale */
--duration-fast: 150ms;     /* Quick interactions */
--duration-base: 250ms;     /* Default animations */
--duration-slow: 350ms;     /* Complex animations */
--duration-slower: 500ms;   /* Page transitions */
```

### Common Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide In From Bottom */
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulse (for loading states) */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### Interactive States

```css
/* Button Hover */
.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
  transition: all var(--duration-fast) var(--ease-out);
}

/* Card Hover */
.card:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-xl);
  transition: all var(--duration-base) var(--ease-out);
}

/* Focus States */
.interactive:focus {
  outline: 2px solid var(--comet-blue);
  outline-offset: 2px;
}
```

## 🎨 Status & State Visualization

### Status Colors & Icons

```tsx
// Pipeline Status
const StatusIndicator = ({ status }: { status: PipelineStatus }) => {
  const statusConfig = {
    running: { color: 'blue', icon: PlayIcon, label: 'Running' },
    success: { color: 'green', icon: CheckIcon, label: 'Success' },
    failed: { color: 'red', icon: XIcon, label: 'Failed' },
    pending: { color: 'yellow', icon: ClockIcon, label: 'Pending' },
    cancelled: { color: 'gray', icon: StopIcon, label: 'Cancelled' }
  };

  const config = statusConfig[status];
  
  return (
    <div className={`flex items-center gap-2 text-${config.color}-600`}>
      <config.icon className="w-4 h-4" />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
};
```

### Progress Visualization

```tsx
// Build Progress
<ProgressBar
  value={progressValue}
  max={100}
  variant="success"
  showPercentage
  label="Build Progress"
  sublabel="Compiling TypeScript..."
/>

// Step Progress
<StepProgress
  steps={[
    { label: 'Code Checkout', status: 'completed' },
    { label: 'Dependencies', status: 'completed' },
    { label: 'Build', status: 'running' },
    { label: 'Tests', status: 'pending' },
    { label: 'Deploy', status: 'pending' }
  ]}
  currentStep={2}
/>
```

## 📊 Data Visualization Standards

### Chart Colors

```css
/* Primary Chart Colors */
--chart-blue: #007AFF;
--chart-green: #34C759;
--chart-orange: #FF9500;
--chart-red: #FF3B30;
--chart-purple: #AF52DE;
--chart-teal: #5AC8FA;
--chart-pink: #FF2D92;

/* Chart Background */
--chart-grid: #F2F2F7;
--chart-background: #FFFFFF;
```

### Chart Types

```tsx
// Success Rate Over Time
<LineChart
  data={successRateData}
  xAxis="date"
  yAxis="successRate"
  color="var(--chart-green)"
  title="Pipeline Success Rate"
  description="Last 30 days"
/>

// Build Duration Distribution
<BarChart
  data={buildDurationData}
  xAxis="duration"
  yAxis="count"
  color="var(--chart-blue)"
  title="Build Duration Distribution"
/>

// Test Coverage Breakdown
<PieChart
  data={coverageData}
  colorScheme={['--chart-green', '--chart-orange', '--chart-red']}
  title="Test Coverage Breakdown"
/>
```

## ♿ Accessibility Guidelines

### Color & Contrast

- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- Use color plus another indicator for important information

### Keyboard Navigation

```tsx
// Keyboard-accessible components
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  aria-label="Execute pipeline"
>
  Execute
</Button>

// Focus management
<Modal
  isOpen={isOpen}
  onClose={onClose}
  initialFocus={firstInputRef}
  finalFocus={triggerRef}
>
  {/* Modal content */}
</Modal>
```

### Screen Reader Support

```tsx
// Semantic HTML
<main aria-label="Pipeline dashboard">
  <section aria-labelledby="active-pipelines">
    <h2 id="active-pipelines">Active Pipelines</h2>
    {/* Pipeline list */}
  </section>
</main>

// ARIA labels
<button
  aria-label="Stop pipeline build"
  aria-describedby="pipeline-status"
>
  <StopIcon />
</button>

<div id="pipeline-status" className="sr-only">
  Pipeline is currently running, click to stop
</div>
```

## 🌙 Dark Mode Implementation

### Theme Toggle

```tsx
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Dark Mode Colors

```css
/* Dark mode utilities */
.dark {
  --background: var(--dark-bg);
  --foreground: var(--dark-text-primary);
  --card: var(--dark-bg-secondary);
  --card-foreground: var(--dark-text-primary);
  --border: var(--dark-bg-tertiary);
  --input: var(--dark-bg-tertiary);
}

/* Component adaptation */
.card {
  background-color: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
}
```

## 📱 Mobile-First Considerations

### Touch Targets

- Minimum 44px touch target size
- Adequate spacing between interactive elements
- Swipe gestures for navigation

### Performance

- Lazy loading for images and components
- Optimized animations for mobile devices
- Reduced motion preferences

### Progressive Enhancement

- Core functionality works without JavaScript
- Enhanced experience with JavaScript enabled
- Offline capabilities where appropriate

---

This design system ensures Comet delivers a consistent, accessible, and delightful user experience across all devices and use cases, maintaining the high standards users expect from enterprise DevOps platforms.
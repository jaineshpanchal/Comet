# 🚀 Contributing to Comet DevOps Platform

Thank you for your interest in contributing to Comet! This document provides guidelines and instructions for contributing to our flagship DevOps platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🏁 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Python 3.9 or higher
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/comet-devops-platform.git
   cd comet-devops-platform
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup-dev.sh
   ./setup-dev.sh
   ```

3. **Start the development environment**
   ```bash
   ./start-dev.sh
   ```

4. **Verify the setup**
   - Frontend: http://localhost:3030
   - API Gateway: http://localhost:3000
   - AI Services: http://localhost:8001

## 🛠️ Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug fixes** - Fix issues and improve stability
- **Feature development** - Add new features and capabilities
- **Documentation** - Improve documentation and guides
- **Testing** - Add tests and improve coverage
- **Performance** - Optimize performance and scalability
- **Design** - Improve UI/UX and user experience

### Branch Naming Convention

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates
- `test/description` - Test additions/improvements
- `refactor/description` - Code refactoring

Examples:
- `feature/ai-test-generation`
- `bugfix/pipeline-execution-error`
- `docs/api-authentication-guide`

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

Examples:
```
feat(pipeline): add parallel job execution
fix(auth): resolve JWT token expiration issue
docs(api): update authentication endpoints
test(frontend): add unit tests for dashboard components
```

## 🔀 Pull Request Process

### Before Submitting

1. **Create an issue** (for significant changes)
2. **Fork the repository** and create your branch
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Run the test suite** to ensure everything works
7. **Commit your changes** with clear messages

### Pull Request Template

When submitting a PR, please use this template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots/Videos
(If applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated checks** must pass (CI/CD, linting, tests)
2. **Code review** by at least one maintainer
3. **Manual testing** for significant changes
4. **Documentation review** for user-facing changes
5. **Approval** from code owner

## 🐛 Issue Reporting

### Bug Reports

When reporting bugs, please include:

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 119]
- Node.js: [e.g., 18.17.0]
- Python: [e.g., 3.11.0]

**Screenshots/Logs**
(If applicable)

**Additional Context**
Any other relevant information
```

### Feature Requests

For feature requests, please include:

```markdown
**Feature Summary**
Brief summary of the requested feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Mockups, examples, or other context
```

## 📏 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer functional components and hooks
- Use descriptive variable and function names
- Add JSDoc comments for public APIs

```typescript
/**
 * Executes a pipeline with the specified configuration
 * @param pipelineId - Unique identifier for the pipeline
 * @param config - Pipeline configuration object
 * @returns Promise resolving to execution result
 */
async function executePipeline(
  pipelineId: string,
  config: PipelineConfig
): Promise<ExecutionResult> {
  // Implementation
}
```

### Python

- Follow PEP 8 style guide
- Use type hints for all functions
- Use Black for code formatting
- Use isort for import sorting
- Add docstrings for all functions and classes

```python
def generate_test_cases(
    source_code: str,
    test_type: TestType = TestType.UNIT
) -> List[TestCase]:
    """
    Generate test cases using AI for the provided source code.
    
    Args:
        source_code: The source code to generate tests for
        test_type: Type of tests to generate (unit, integration, e2e)
        
    Returns:
        List of generated test cases
        
    Raises:
        GenerationError: If test generation fails
    """
    # Implementation
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow the design system variables
- Use CSS custom properties for theming
- Avoid arbitrary values when possible
- Group related utilities together

```tsx
<div className="
  flex items-center gap-4 p-6
  bg-white dark:bg-gray-900
  border border-gray-200 dark:border-gray-700
  rounded-lg shadow-sm
  hover:shadow-md transition-shadow duration-200
">
  {/* Component content */}
</div>
```

## 🧪 Testing Requirements

### Frontend Testing

- **Unit tests** for all components and utilities
- **Integration tests** for complex workflows
- **E2E tests** for critical user journeys
- **Accessibility tests** for all components

```typescript
// Component test example
describe('PipelineCard', () => {
  it('should display pipeline status correctly', () => {
    render(<PipelineCard pipeline={mockPipeline} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const onClickMock = jest.fn();
    render(<PipelineCard pipeline={mockPipeline} onClick={onClickMock} />);
    
    await user.click(screen.getByRole('button', { name: /view details/i }));
    expect(onClickMock).toHaveBeenCalledWith(mockPipeline.id);
  });
});
```

### Backend Testing

- **Unit tests** for all services and utilities
- **Integration tests** for API endpoints
- **Contract tests** for external integrations

```typescript
// Service test example
describe('PipelineService', () => {
  let service: PipelineService;
  let mockRepository: jest.Mocked<PipelineRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new PipelineService(mockRepository);
  });

  it('should create pipeline successfully', async () => {
    const pipelineData = { name: 'Test Pipeline', /* ... */ };
    mockRepository.create.mockResolvedValue(mockPipeline);

    const result = await service.createPipeline(pipelineData);

    expect(result).toEqual(mockPipeline);
    expect(mockRepository.create).toHaveBeenCalledWith(pipelineData);
  });
});
```

### AI Services Testing

- **Unit tests** for AI functions
- **Integration tests** with mock AI services
- **Performance tests** for AI operations

```python
import pytest
from unittest.mock import Mock, patch

class TestTestGenerator:
    def test_generate_unit_tests(self):
        """Test unit test generation functionality."""
        generator = TestGenerator()
        source_code = "def add(a, b): return a + b"
        
        result = generator.generate_tests(source_code, TestType.UNIT)
        
        assert len(result) > 0
        assert all(isinstance(test, TestCase) for test in result)

    @patch('openai.ChatCompletion.create')
    def test_ai_integration(self, mock_openai):
        """Test AI service integration."""
        mock_openai.return_value = Mock(choices=[Mock(message=Mock(content="test"))])
        
        generator = TestGenerator()
        result = generator.generate_with_ai("sample code")
        
        assert result is not None
        mock_openai.assert_called_once()
```

### Test Coverage Requirements

- **Minimum 80% coverage** for all new code
- **90% coverage** for critical paths
- **100% coverage** for utility functions

Run coverage reports:
```bash
# Frontend
npm run test:coverage

# Backend
npm run test:coverage

# AI Services
cd ai-services && python -m pytest --cov=src --cov-report=html
```

## 📚 Documentation

### Code Documentation

- **JSDoc/TSDoc** for all public APIs
- **Python docstrings** for all functions and classes
- **README files** for each module
- **API documentation** using OpenAPI/Swagger

### User Documentation

- **Feature documentation** for new capabilities
- **API guides** for integration developers
- **Troubleshooting guides** for common issues
- **Video tutorials** for complex workflows

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date with code changes

## 🏆 Recognition

Contributors will be recognized in:

- **Contributors list** in README
- **Release notes** for significant contributions
- **Blog posts** for major features
- **Community highlights** on social media

## 📞 Getting Help

If you need help with contributing:

1. **Check existing documentation** and issues
2. **Ask in discussions** for general questions
3. **Join our Discord** for real-time chat
4. **Email maintainers** for sensitive issues

## 📝 License

By contributing to Comet, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Comet! Together, we're building the future of DevOps automation. 🚀
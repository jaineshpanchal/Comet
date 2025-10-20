# AI Test Generation - User Guide

## What is AI Test Generation?

AI Test Generation automatically creates test files for your code. Instead of writing tests manually, you paste your source code and the AI generates comprehensive test suites for you.

## How to Use It

### Step 1: Navigate to AI Test Generation
1. Go to the Testing dashboard at `/testing`
2. Click the **"AI Generate Tests"** button (purple/pink gradient)

### Step 2: Prepare Your Source Code

Copy the code you want to test. This could be:

**Example 1 - JavaScript Functions:**
```javascript
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}
```

**Example 2 - React Component:**
```javascript
const LoginButton = ({ onClick, disabled }) => {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="login-btn"
    >
      Login
    </button>
  );
};
```

**Example 3 - TypeScript Class:**
```typescript
class ShoppingCart {
  private items: Array<{id: string, price: number}> = [];

  addItem(id: string, price: number) {
    this.items.push({ id, price });
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  clear() {
    this.items = [];
  }
}
```

### Step 3: Configure the Test Generation

1. **Language**: Select your code's language
   - JavaScript
   - TypeScript
   - JSX/TSX (for React)
   - Python
   - Java

2. **Test Framework**: Choose your testing framework
   - Jest (most common for JS/TS)
   - Mocha
   - Jasmine
   - Playwright (for E2E)
   - Cypress (for E2E)

3. **Test Type**:
   - Unit Tests (test individual functions)
   - Integration Tests (test how parts work together)
   - E2E Tests (test user flows)

### Step 4: Paste Your Code

Paste your source code into the large text area. For example:

```javascript
function calculateDiscount(price, percentage) {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Invalid percentage');
  }
  return price - (price * percentage / 100);
}
```

### Step 5: Generate Tests

Click **"Generate Tests with AI"** button. The AI will:
1. Find all functions in your code
2. Create test files for each function
3. Generate multiple test cases per function

### Step 6: Review Generated Tests

You'll see a list of generated test files. For the example above:

**File: `calculateDiscount.test.js`**
```javascript
import { calculateDiscount } from './source';

describe('calculateDiscount', () => {
  it('should work correctly with valid input', () => {
    // Arrange
    const price = 100;
    const percentage = 20;

    // Act
    const result = calculateDiscount(price, percentage);

    // Assert
    expect(result).toBe(80);
  });

  it('should handle edge cases', () => {
    // Test 0% discount
    expect(calculateDiscount(100, 0)).toBe(100);

    // Test 100% discount
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('should handle invalid input', () => {
    // Test negative percentage
    expect(() => calculateDiscount(100, -10)).toThrow('Invalid percentage');

    // Test percentage over 100
    expect(() => calculateDiscount(100, 150)).toThrow('Invalid percentage');
  });
});
```

### Step 7: Use the Generated Tests

You have two options:

1. **Copy to Clipboard**: Click "Copy" to copy the test code
2. **Download**: Click "Download" to save as a `.test.js` file

Then paste or save the test in your project's test folder!

## Real-World Use Cases

### Use Case 1: Testing a Utility Function

**Your Code:**
```javascript
// utils/dateFormatter.js
export function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}
```

**AI Generated Test:**
```javascript
import { formatDate } from './dateFormatter';

describe('formatDate', () => {
  it('should format date correctly', () => {
    expect(formatDate('2024-01-15')).toBe('01/15/2024');
  });

  it('should handle different date formats', () => {
    expect(formatDate('2024-12-31')).toBe('12/31/2024');
  });

  it('should pad single digits', () => {
    expect(formatDate('2024-03-05')).toBe('03/05/2024');
  });
});
```

### Use Case 2: Testing an API Function

**Your Code:**
```javascript
// api/users.js
export async function fetchUser(userId) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('User not found');
  }
  return response.json();
}
```

**AI Generated Test:**
```javascript
import { fetchUser } from './users';

describe('fetchUser', () => {
  it('should fetch user successfully', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'John' })
      })
    );

    const user = await fetchUser(1);
    expect(user).toEqual({ id: 1, name: 'John' });
  });

  it('should handle errors', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false })
    );

    await expect(fetchUser(999)).rejects.toThrow('User not found');
  });
});
```

## What the AI Generates

For each function, the AI creates:

1. ✅ **Import statements** - Brings in your function
2. ✅ **Describe block** - Groups tests for the function
3. ✅ **Valid input test** - Tests normal usage
4. ✅ **Edge case test** - Tests boundary conditions
5. ✅ **Error handling test** - Tests invalid inputs
6. ✅ **TODO comments** - Reminders for customization

## Tips for Best Results

1. **Paste complete functions** - Include the entire function, not just snippets
2. **One file at a time** - Don't paste your entire codebase, focus on specific files
3. **Use meaningful names** - Well-named functions get better tests
4. **Add comments** - The AI can use your comments to generate better tests
5. **Customize after generation** - Always review and improve the generated tests

## Common Questions

**Q: Do I need to write tests from scratch?**
A: No! The AI generates a complete test suite. You just need to review and customize it.

**Q: Will the tests work immediately?**
A: The tests provide a solid foundation, but you may need to:
- Add actual test data
- Update import paths
- Add mocks for external dependencies
- Refine assertions

**Q: Can I generate tests for any language?**
A: Currently supports JavaScript, TypeScript, Python, and Java. More languages coming soon!

**Q: How many tests does it generate?**
A: Usually 3-5 test cases per function:
- 1 for valid/happy path
- 1-2 for edge cases
- 1-2 for error conditions

## Example Workflow

```
1. Write your application code
   ↓
2. Copy a file or function
   ↓
3. Paste into AI Test Generation
   ↓
4. Select language & framework
   ↓
5. Click "Generate Tests"
   ↓
6. Review generated tests
   ↓
7. Download or copy tests
   ↓
8. Save in your test folder
   ↓
9. Run tests with npm test
   ↓
10. Customize as needed
```

## Backend API

The AI Test Generation is powered by:
- **Endpoint**: `POST /api/ai/generate-tests`
- **AI Service**: FastAPI on port 9000
- **Features**: Function extraction, pattern recognition, template generation

## Next Steps

After generating tests:
1. Save them in your project's test directory
2. Run `npm test` to execute them
3. Add more specific test cases as needed
4. Update mocks and test data
5. Achieve higher code coverage!

---

Need help? The AI generates a great starting point, but you're the expert on your code!

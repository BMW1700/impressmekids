

# Simplify DemoGate to Single Access Code

## Change
**`src/components/DemoGate.tsx`**: Remove the username field entirely. Replace with a single "Access Code" input. The code is `Brecon69`.

- Remove `DEMO_USERNAME` constant
- Change `DEMO_PASSWORD` to `DEMO_CODE = "Brecon69"`
- Remove username state and input
- Update the form to show one field labeled "Access Code"
- Validation checks just the single code

One file, one edit.


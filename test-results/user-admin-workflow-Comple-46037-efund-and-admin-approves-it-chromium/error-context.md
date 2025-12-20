# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img "ProtoLab Logo" [ref=e8]
      - heading "Welcome to ProtoLab" [level=3] [ref=e9]
      - paragraph [ref=e10]: Log in to access your dashboard and manage your 3D printing orders
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - text: Email
          - textbox "Email" [ref=e14]:
            - /placeholder: your@email.com
        - generic [ref=e15]:
          - text: Password
          - textbox "Password" [ref=e16]:
            - /placeholder: ••••••••
        - button "Forgot password?" [ref=e17] [cursor=pointer]
      - generic [ref=e18]:
        - button "Sign In" [ref=e19] [cursor=pointer]:
          - generic [ref=e20]: Sign In
        - generic [ref=e26]: Or continue with
        - iframe [ref=e30]:
          - button "Zaloguj się przez Google. Otwiera się w nowej karcie" [ref=f1e3] [cursor=pointer]:
            - generic [ref=f1e5]:
              - img [ref=f1e7]
              - generic [ref=f1e14]: Zaloguj się przez Google
        - generic [ref=e31]:
          - text: Don't have an account?
          - link "Sign Up" [ref=e32] [cursor=pointer]:
            - /url: /signup
```
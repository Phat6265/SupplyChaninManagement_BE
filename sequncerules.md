# Sequence Diagram Rules & Conventions

## 1. General Principles

* Sequence Diagram must represent the actual execution flow of the system.
* Interaction flow must be:

  * linear
  * continuous
  * traceable
  * caller/callee consistent
* Time flows from top to bottom.
* Participants should be ordered from left to right according to architecture layers.

Recommended order:

```text
Actor -> UI -> Controller -> Service -> Repository -> Database -> External System
```

---

# 2. Message Rules

## 2.1 Request Message

Request/call message MUST use solid line.

Syntax:

```text
A -> B : action()
```

Rules:

* Represents synchronous request.
* Message name must be an action/verb.
* Must follow actual execution order.

Correct:

```text
UI -> AuthService : authenticate()
```

Incorrect:

```text
UI -> AuthService : auth
```

---

## 2.2 Response Message

Response/return message MUST use dashed line.

Syntax:

```text
B --> A : result
```

Rules:

* Response must return to the immediate caller.
* Never skip intermediate participants.
* Must preserve call stack order.

Correct:

```text
A -> B
B -> C
C --> B
B --> A
```

Incorrect:

```text
A -> B
B -> C
C --> A
```

---

# 3. Message Numbering

All request/response flows SHOULD be numbered.

## 3.1 Top-Level Flow

```text
1.
2.
3.
```

Example:

```text
User -> UI : 1. login()
UI -> AuthService : 2. authenticate()
```

---

## 3.2 Nested Flow

Nested calls SHOULD use hierarchical numbering.

Example:

```text
1.
1.1
1.1.1
1.1.2
1.2
```

Example:

```text
UI -> Service : 1. authenticate()
Service -> DB : 1.1 findUser()
DB --> Service : 1.2 user
```

---

# 4. Call Stack Consistency

Sequence flow MUST follow actual call stack behavior.

Rules:

* Caller invokes callee.
* Callee returns to caller.
* Response path must mirror request path.
* No jumping across participants.

Correct:

```text
A -> B
B -> C
C --> B
B --> A
```

Incorrect:

```text
A -> B
B -> C
C --> A
```

---

# 5. Layer Traversal Rules

Messages MUST NOT bypass architectural layers.

Incorrect:

```text
UI -> Service
Service -> DB
DB --> UI
```

Correct:

```text
UI -> Service
Service -> DB
DB --> Service
Service --> UI
```

Rules:

* Every participant only communicates with adjacent logical layer.
* No shortcut return paths.
* No hidden execution jumps.

---

# 6. Activation Rules

Activation bars SHOULD reflect actual execution duration.

Rules:

* `activate` starts when receiving request.
* `deactivate` occurs before returning response.
* Activation must remain continuous during processing.

Example:

```text
activate Service
Service -> DB : query()
DB --> Service : result
deactivate Service
```

---

# 7. Alternative Flow (alt)

`alt` MUST be used only when business logic clearly contains multiple branches.

Typical cases:

* success/failure
* valid/invalid
* found/not found
* approved/rejected

Syntax:

```text
alt Success
    ...
else Failure
    ...
end
```

Example:

```text
alt Login success
    Service --> UI : token
else Login failed
    Service --> UI : error
end
```

---

# 8. Optional Flow (opt)

Use `opt` for optional execution paths.

Example:

```text
opt rememberMe enabled
    Service -> Cache : saveSession()
end
```

---

# 9. Loop Flow

Use `loop` for repeated execution.

Example:

```text
loop for each item
    Service -> DB : save()
end
```

---

# 10. Naming Convention

## 10.1 Participant Naming

Use meaningful names.

Recommended:

```text
orderService:OrderService
paymentGateway
userRepository
```

Avoid:

```text
service1
db2
temp
```

---

## 10.2 Message Naming

Message names MUST:

* use verbs
* represent actual operation
* follow method-like naming

Correct:

```text
validateUser()
saveOrder()
generateToken()
```

Incorrect:

```text
data
process
logic
```

---

# 11. Diagram Scope

Rules:

* One Sequence Diagram SHOULD represent one primary use case.
* Avoid combining unrelated business flows.
* Complex systems SHOULD split diagrams by scenario.

Recommended:

* Login Flow
* Payment Flow
* Refund Flow

Not:

* Login + Payment + Report in one diagram

---

# 12. Readability Rules

## Recommended Limits

| Item           | Recommendation        |
| -------------- | --------------------- |
| Participants   | <= 10                 |
| Primary Flow   | Single responsibility |
| Crossed Arrows | Avoid                 |
| Nesting Depth  | Keep shallow          |

---

# 13. Syntax Rules (PlantUML)

Mandatory:

* All `alt` blocks must end with `end`
* All `activate` must have matching `deactivate`
* Request uses `->`
* Response uses `-->`

Correct:

```text
A -> B : request
B --> A : response
```

Incorrect:

```text
A --> B : request
```

---

# 14. Enterprise Review Rules

A Sequence Diagram is considered valid only if:

* Request/response flows are consistent
* No participant skipping exists
* Numbering is correct
* Alternative branches are explicit
* Execution order is traceable
* Architecture layers are respected
* Syntax contains zero errors

---

# 15. Standard Enterprise Template

```text
@startuml

actor User
participant UI
participant AuthService
database DB

User -> UI : 1. login()
activate UI

UI -> AuthService : 1.1 authenticate()
activate AuthService

AuthService -> DB : 1.1.1 findUser()
activate DB

DB --> AuthService : 1.1.2 user
deactivate DB

alt Valid credential

    AuthService --> UI : 1.1.3 token

else Invalid credential

    AuthService --> UI : 1.1.3 error

end

deactivate AuthService

UI --> User : 1.2 loginResult()
deactivate UI

@enduml
```

---
name: ✨ Feature Request
about: Suggest a new feature or enhancement
title: '[FEATURE] '
labels: ['enhancement', 'needs-triage']
assignees: ''
---

## Feature Description
<!-- A clear and concise description of the feature you're proposing -->


## Problem Statement
<!-- What problem does this feature solve? -->

**As a** [type of user]
**I want** [goal]
**So that** [benefit/value]

## Proposed Solution
<!-- Describe how you envision this feature working -->


## Alternative Solutions
<!-- Any alternative solutions or features you've considered -->


## User Stories
<!-- Break down the feature into user stories if applicable -->

1. As a [user type], I should be able to [action] so that [benefit]
2. As a [user type], I should be able to [action] so that [benefit]

## Requirements

### ✅ Functional Requirements
<!-- What should this feature do? -->

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### ✅ Non-Functional Requirements
<!-- Performance, security, scalability considerations -->

- [ ] Performance: Target response time ___ms
- [ ] Security: Authentication/Authorization requirements
- [ ] Scalability: Expected load/users
- [ ] Compliance: Any regulatory requirements

### ✅ Technical Requirements
<!-- What technical implementation is needed? -->

- [ ] Backend changes (NestJS/Java)
- [ ] Frontend changes (React/React Native)
- [ ] Database schema changes
- [ ] API changes
- [ ] Infrastructure changes
- [ ] Third-party integrations

## Impact Assessment

### Benefits
<!-- What value does this bring? -->

- 
- 
- 

### Risks
<!-- What risks or challenges do you foresee? -->

- 
- 
- 

### Dependencies
<!-- Does this depend on other features or systems? -->

- 
- 

## Service/App Affected
<!-- Which parts of the platform will be affected? -->

- [ ] NestJS Backend (Telematics/Booking/Fleet/Charging)
- [ ] Java Backend (Auth/Payment)
- [ ] Temporal Workers
- [ ] Admin Dashboard
- [ ] Driver App
- [ ] Support App
- [ ] BI Partner App
- [ ] Mobile Passenger App
- [ ] Mobile Driver App
- [ ] Infrastructure/DevOps

## Design Considerations

### UI/UX Mockups
<!-- If this is a frontend feature, include mockups or wireframes -->


### API Design
<!-- If this requires new APIs, describe the endpoints -->

```typescript
// Example API structure
POST /api/v1/feature
{
  "param1": "value1",
  "param2": "value2"
}

Response:
{
  "id": "123",
  "status": "success"
}
```

### Database Schema
<!-- If database changes are needed, describe them -->

```sql
-- Example schema changes
CREATE TABLE new_feature (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Success Criteria
<!-- How will we know this feature is successful? -->

- [ ] Users can [specific action]
- [ ] Performance meets [specific metric]
- [ ] Adoption rate reaches [specific target]

## Implementation Checklist
<!-- What needs to be done to implement this feature? -->

### Backend
- [ ] API endpoints implemented
- [ ] Database migrations created
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] API documentation updated

### Frontend
- [ ] UI components created
- [ ] Form validation implemented
- [ ] Error handling added
- [ ] Loading states implemented
- [ ] Tests written

### Infrastructure
- [ ] Environment variables configured
- [ ] Secrets management setup
- [ ] Deployment scripts updated

### Documentation
- [ ] User documentation written
- [ ] API documentation updated
- [ ] Technical specifications documented
- [ ] README updated

## Priority
<!-- How important is this feature? -->

- [ ] 🔴 Critical - Blocker for launch/key business objective
- [ ] 🟡 High - Important for user experience/business value
- [ ] 🟠 Medium - Nice to have/improves workflow
- [ ] 🟢 Low - Quality of life improvement

## Timeline
<!-- When is this needed? -->

- **Target release**: 
- **Hard deadline** (if any): 
- **Can be deferred**: Yes / No

## Additional Context
<!-- Any other context, screenshots, or references -->


## Related Issues
<!-- Link to related issues or PRs -->


---

**Remember:** Every new feature MUST include:
1. ✅ Unit tests
2. ✅ UI components (if user-facing)
3. ✅ Documentation

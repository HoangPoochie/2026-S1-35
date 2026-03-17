docker compose is inside docker, to run mysql, cd docker, run: docker compose up -d
for backend, scripts avaliable are inside package.json

## Naming style:
1) Variables and functions: camelCase 
# .e.g: 
    const surveyResults = [];
    const selfAwarenessScore = 0;
    const feedbackComment = '';

2) Components: PascalCase
# .e.g:
    SurveyForm.vue
    WorkshopDashboard.vue
    EmotionChart.vue
    ParticipantList.vue

3) Constants: UPPER_SNAKE_CASE
# .e.g:
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const MAX_RETRIES = 3;
    const DEFAULT_SCORE = 0;

4) CSS classes: kebab-case
# .e.g:
    .survey-form
    .submit-button
    .error-message
    .dashboard-card

5) Routes and folders: kebab-case
# .e.g:
    /workshop-results
    /participant-feedback
    /api/surveys
    /api/workshop-results
    /api/participant-feedback

    components/
    pages/
    services/
    utils/
    assets/
    styles/
    admin-dashboard/

6) Branches: type/BVOM-ticket-short-description
# .e.g:
    feature/BVOM-12-eq-survey-form
    fix/BVOM-18-navbar-layout
    docs/BVOM-05-readme-update
    refactor/BVOM-21-survey-service
    test/BVOM-30-score-calculation
    chore/BVOM-02-project-setup
# Copyables: git branch type/BVOM-ticket-short-description

7) Commits: type: short description
# .e.g:
    feat: add EQ survey submission form
    fix: correct score calculation bug
    refactor: extract survey scoring logic
    docs: update installation steps
    test: add unit tests for empathy score calculation
    chore: install axios and router
# Copyable: git commit -m "type" -m "description"



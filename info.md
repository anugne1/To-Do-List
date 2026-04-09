<!-- tikrinti backenda: -->

<!-- https://localhost:3001/tasks
https://localhost:3001/tasks?status=pending
https://localhost:3001/tasks?status=done
https://localhost:3001/tasks?due_date=2026-04-20 -->




<!-- 

POST https://localhost:3001/tasks
{
  "title": "Test task",
  "due_date": "2026-04-20",
  "email": "test@example.com"
}


PUT https://localhost:3001/tasks/<id>
{
  "title": "Updated title",
  "due_date": "2026-04-25",
  "email": "test@example.com",
  "status": "pending"
}


PATCH https://localhost:3001/tasks/<id>/status
{ "status": "done" }


DELETE https://localhost:3001/tasks/<id>


POST https://localhost:3001/send-reminders-now -->
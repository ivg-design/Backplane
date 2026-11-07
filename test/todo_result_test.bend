import Base
import ../src/core/todo.bend as TD

def result(text: String) -> String:
  TD.Todo.result(text)

def digits(text: String) -> String:
  TD.Todo.digits(text)

# Preserve the existing todo_task_result_number law while this fixture is
# checked, without loading the unrelated application and UI proof closure.
def task_number_law() -> {TD.Todo.result("Task #12 created successfully: a") == "12" : String}:
  {==}

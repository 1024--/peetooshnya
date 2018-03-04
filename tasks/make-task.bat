g++ taskgen.cpp -o taskgen && taskgen 1 100 2 > nul && ren task-temp.exe task.exe

rem   make-task подготовит task.exe
rem   task <imin> <imax> <delta> запускает просчёт чисел 

#include <cstdlib>
#include <fstream>
#include <sstream>
#include <iostream>

int main(int argc, char** argv) {
  const int ARGC = 4;
  if(argc < ARGC) {
    std::cerr << "please provide " << (ARGC-1) << " arguments." << std::endl;
    return 1;
  }
  size_t imin = atoi(argv[1]), imax = atoi(argv[2]), d = atoi(argv[3]);
  
  std::ofstream task_c;
  task_c.open ("task.c", std::ofstream::out | std::ofstream::trunc);

  task_c << "#include <stdio.h>" << std::endl
         << "#include <string.h>" << std::endl
         << "int main(int argc, char**argv)" << std::endl
         << "{" << std::endl
         << "    if(argc < " << ARGC << ") {" << std::endl
         << "        puts(\"usage: task <imin> <imax> <delta>\");" << std::endl
         << "        return 1;" << std::endl
         << "    }" << std::endl
         << "    if(strcmp(argv[1], \"" << argv[1] << "\")";
  
  for(int i=2; i<ARGC; ++i)
    task_c << " || strcmp(argv[" << i << "], \"" << argv[i] << "\")";
  
  task_c << ") {" << std::endl
         << "        if(system(\"g++ taskgen.cpp -o taskgen\")) return 2;" << std::endl
         << "        char command[" << sizeof("taskgen") + (ARGC-1)*11 + 2 << "];" << std::endl
         << "        strcpy(command, \"taskgen \");" << std::endl
         << "        strcat(command, argv[1]);" << std::endl;
  
  for(int i=2; i<ARGC; ++i)
    task_c << "        strcat(command, \" \");" << std::endl
           << "        strncat(command, argv[" << i << "], 10);" << std::endl;
  
  task_c << "        return system(command);" << std::endl
         << "    }" << std::endl
         << "    puts(\"";
  
  task_c << imin;
  for(size_t i = imin + d; i < imax; i += d)
    task_c << "\\n" << i;
  
  task_c << "\");" << std::endl
         << "    return 0;" << std::endl
         << "}" << std::endl;

  task_c.close();

  int i;
  if(i = system("gcc task.c -o task-temp")) return i;

  std::ostringstream command;
  command << "task-temp";
  for(size_t i=1; i<ARGC; ++i)
    command << " \"" << argv[i] << "\"";
  return system(command.str().c_str());
}

              <|- Console <- + - - - +
                             |       |
              <|- Window - - + ref   |
Object = var       |ref              |
   | ^             v                 |
   | |        <|- Math               |value
   | |             |                 |
   | + - - - - - - +                 |
   |          value                  |
   | ptr                             |
   |                                 v
   |     <|- ObjectBody <|--- ConsoleLogBody
   |     <|- NumberBody
   v     <|- StringBody
BaseBody <|- BoolBody
         <|- NullBody
         <|- UndefinedBody
         <|- FunctionBody - - > FunctionCall

Object null, undefined, NaN, Infinity;
Object Number, String, Boolean;
Math Math;
Window window;
Console console;

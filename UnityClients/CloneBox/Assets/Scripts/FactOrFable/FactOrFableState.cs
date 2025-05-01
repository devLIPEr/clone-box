using System.Collections;
using System.Collections.Generic;
using System;

[Flags]
public enum FactOrFableState
{
    None    = 0b_0000_0000, // 0
    Started = 0b_0000_0001, // 1
    Writing = 0b_0000_0010, // 2
    Voting  = 0b_0000_0100, // 4
    Points  = 0b_0000_1000  // 8
}
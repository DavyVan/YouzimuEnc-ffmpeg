#include<cstdio>
#include<windows.h>

int main()
{
    for (int i = 0; i < 10; i++)
    {
        Sleep(2000);    // ms
        printf("Hello..%d\n", i);
        fflush(stdout);
    }
}
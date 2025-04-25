#include<iostream>
#include<math.h>
using namespace std;

int main(){
    int tracks;
    cout<<"Enter the number of tracks: ";
    cin>>tracks;
    int curr;
    cout<<"Enter the current position of read/write head: ";
    cin>>curr;
    int size;
    cout<<"Enter the count of total requests in request queue: ";
    cin>>size;
    int arr[size];
    for(int i=0;i<size;i++){
        cout<<"Enter the "<<i+1<<" request location: ";
        cin>>arr[i];
    }
    cout<<"The request queue contains track number as: ";
    for(int i=0;i<size;i++){
        cout<<arr[i]<<" ";
    }
    cout<<endl;
    int time=0;
    for(int i=0;i<size;i++){
        time += abs(arr[i]-curr);
        curr=arr[i];
    }
    
    cout<<"The total number of track movements as per FCFS algorithm: "<<time;
}
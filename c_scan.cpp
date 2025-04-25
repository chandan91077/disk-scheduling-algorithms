#include<iostream>
#include<math.h>
using namespace std;
#include<algorithm>

int main(){
    int tracks;
    cout<<"Enter the number of tracks: ";
    cin>>tracks;
    int curr;
    cout<<"Enter the current position of read/write head: ";
    cin>>curr;
    int size;
    cout<<"Enter the direction (either left or right): ";
    string dir;
    cin>>dir;
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
    sort(arr,arr+size);
    int curridx=0;
    for(int i=1;i<size;i++){
        if(curr>arr[i-1] && curr<arr[i+1]){
            curridx=i+1;
            break;
        }
    }
    
    int sum=0;
    if(dir=="right"){
        for(int i=curridx;i<size;i++){
            sum+=abs(arr[i]-curr);
            curr=arr[i];
        }
        sum += abs((tracks-1)-curr);
        sum+=(tracks-1);
        curr=0;
        for(int i=0;i<curridx;i++){
            sum += abs(arr[i]-curr);
            curr=arr[i];
        }
    }
    else if(dir=="left"){
        for(int i=curridx-1;i>=0;i--){
            sum+=abs(arr[i]-curr);
            curr=arr[i];
        }
        sum += abs(curr-0);
        sum+=(tracks-1);
        curr=tracks-1;
        for(int i=size-1;i>=curridx;i--){
            sum += abs(arr[i]-curr);
            curr=arr[i];
        }
    }
    else{
        cout<<"Invalid Operation.";
        return 0;
    }
    cout<<"The total number of track movements as per C-SCAN algorithm: "<<sum;
}
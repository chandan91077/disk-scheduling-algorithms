#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <limits>

using namespace std;

int main() {
    int tracks;
    cout << "Enter the number of tracks: ";
    cin >> tracks;

    int curr;
    cout << "Enter the current position of read/write head: ";
    cin >> curr;

    int size;
    cout << "Enter the count of total requests in request queue: ";
    cin >> size;

    vector<int> arr(size);
    for (int i = 0; i < size; i++) {
        cout << "Enter the " << i + 1 << " request location: ";
        cin >> arr[i];
    }

    // Sort the request queue
    sort(arr.begin(), arr.end());

    // Print the sorted request queue
    cout << "Sorted request queue: ";
    for (int i = 0; i < arr.size(); i++) {
        cout << arr[i] << " ";
    }
    cout << endl;

    // Vector to keep track of serviced requests
    vector<bool> serviced(arr.size(), false);
    int total_head_movement = 0;
    int current_position = curr;

    // Process all requests
    for (int count = 0; count < arr.size(); count++) {
        int closest_index = -1;
        int closest_distance = numeric_limits<int>::max();

        // Find the closest request
        for (int i = 0; i < arr.size(); i++) {
            if (!serviced[i]) {
                int distance = abs(arr[i] - current_position);
                if (distance < closest_distance) {
                    closest_distance = distance;
                    closest_index = i;
                }
            }
        }

        // Service the closest request
        serviced[closest_index] = true;
        total_head_movement += closest_distance;
        current_position = arr[closest_index];

        // Print the serviced request
        cout << "Serviced track: " << arr[closest_index] << endl;
    }

    // Print total head movement
    cout << "Total head movement: " << total_head_movement << endl;

    return 0;
}
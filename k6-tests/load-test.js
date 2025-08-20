import http from 'k6/http';
import { check, sleep } from 'k6';

// Change this to your actual app URL
const url = 'http://161.35.216.161:31160/';

export let options = {
  // Simulate very high load by ramping up to 1000 VUs (virtual users)
  stages: [
    { duration: '10s', target: 1000 }, // Ramp up to 1000 VUs over 10 seconds
    { duration: '3m', target: 1000 },  // Hold 1000 VUs for 2 minutes (you can extend this)
    { duration: '10s', target: 0 },    // Ramp down to 0 VUs over 10 seconds
  ],
  thresholds: {
    // Set thresholds to check if the request fails (optional)
    'http_req_duration': ['p(95)<500'], // 95% of requests should take less than 500ms
  },
};

export default function () {
  // Send concurrent HTTP requests to simulate more load
  let res = http.get(url);
  
  // Check that the request was successful (status 200)
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  // Introduce a very small delay between requests to simulate continuous load
  sleep(0.1); // Reduces sleep time to simulate faster load generation
}

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  // Adjust the number of virtual users (vus) and iterations based on your requirements
  vus: 10000,  // Number of virtual users
  duration: '20s', // Duration of the test
};

export default function () {
  // URL of the HTTP endpoint you want to stress test
  const url = 'http://161.35.216.161:31160/';
  
  // Send a GET request to the endpoint
  const res = http.get(url);

  // Check if the response status is OK (200)
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  // Simulate high memory usage by storing large amounts of data
  const largeArray = new Array(10 ** 7).fill(res.body);  // Store the entire response body in a large array
  console.log(`Memory Usage Simulation: Created an array of size ${largeArray.length}`);

  // The k6 script continues running, and the memory usage increases over time
  // You can repeat this with many requests to your endpoint
}

const { handler } = require('./index');
const event = {
    version: '1.0',
    resource: '/api/{var+}',
    path: '/default/api/forLoopTest1',
    httpMethod: 'GET',
    headers: {
      'Content-Length': '0',
      Host: 'y0z3wcq4bf.execute-api.eu-west-1.amazonaws.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
      'X-Amzn-Trace-Id': 'Root=1-6310470d-04fdcf0b3e43711949410751',
      'X-Forwarded-For': '85.247.27.119',
      'X-Forwarded-Port': '443',
      'X-Forwarded-Proto': 'https',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    },
    multiValueHeaders: {
      'Content-Length': [ '0' ],
      Host: [ 'y0z3wcq4bf.execute-api.eu-west-1.amazonaws.com' ],
      'User-Agent': [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
      ],
      'X-Amzn-Trace-Id': [ 'Root=1-6310470d-04fdcf0b3e43711949410751' ],
      'X-Forwarded-For': [ '85.247.27.119' ],
      'X-Forwarded-Port': [ '443' ],
      'X-Forwarded-Proto': [ 'https' ],
      accept: [
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
      ],
      'accept-encoding': [ 'gzip, deflate, br' ],
      'accept-language': [ 'en-US,en;q=0.9' ],
      'cache-control': [ 'max-age=0' ],
      'sec-ch-ua': [
        '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"'
      ],
      'sec-ch-ua-mobile': [ '?0' ],
      'sec-ch-ua-platform': [ '"Windows"' ],
      'sec-fetch-dest': [ 'document' ],
      'sec-fetch-mode': [ 'navigate' ],
      'sec-fetch-site': [ 'none' ],
      'sec-fetch-user': [ '?1' ],
      'upgrade-insecure-requests': [ '1' ]
    },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    requestContext: {
      accountId: '440535372894',
      apiId: 'y0z3wcq4bf',
      domainName: 'y0z3wcq4bf.execute-api.eu-west-1.amazonaws.com',
      domainPrefix: 'y0z3wcq4bf',
      extendedRequestId: 'XxAKHiulDoEEPcg=',
      httpMethod: 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        caller: null,
        cognitoAmr: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '85.247.27.119',
        user: null,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
        userArn: null
      },
      path: '/default/api/simpleTest',
      protocol: 'HTTP/1.1',
      requestId: 'XxAKHiulDoEEPcg=',
      requestTime: '01/Sep/2022:05:45:49 +0000',
      requestTimeEpoch: 1662011149380,
      resourceId: 'ANY /api/{var+}',
      resourcePath: '/api/{var+}',
      stage: 'default'
    },
    pathParameters: { var: 'test' },
    stageVariables: null,
    body: null,
    isBase64Encoded: false
  }
  
  const ret = handler(event, null).then((value) => { 
    console.log(value);
    //now do it from cache
    return handler(event, null).then((value) => console.log(value));
  });

//   setTimeout(() => {
//     const ret2 = handler(event, null).then((value) => console.log(value));;
//   }, 61000)

  //const ret2 = handler(event, null).then((value) => console.log(value));;


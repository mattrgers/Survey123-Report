/**
 * define token as global variable
 */
let token;

/**
 * check signin status when loaded the webpage
 */
require([
  "esri/identity/OAuthInfo",
  "esri/identity/IdentityManager",
], (OAuthInfo, esriId) => {
  let info = new OAuthInfo({
    // Swap this ID out with registered application ID
    appId: "ASdBUonq0kdFrBGt",
    // Uncomment the next line and update if using your own portal
    portalUrl: "https://www.arcgis.com",
    popup: false
  });
  esriId.registerOAuthInfos([info]);

  esriId
    .checkSignInStatus(info.portalUrl + "/sharing")
    .then(() => {
      return esriId.getCredential(info.portalUrl + "/sharing");
    })
    .then((credential) => {
      token = credential.token;
    })
    .catch((err) => {
      console.error(err);

      /**
       * if user did not signin
       * ask to sign in first
       */
      esriId.getCredential(info.portalUrl + "/sharing");
    });
});

const estimateBtn = document.getElementById('estimate-btn');
const reportBtn = document.getElementById('report-btn');

/**
 * sendHttpRequest
 */
function sendHttpRequest(method, url, data) {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.responseType = 'json';

    if (data) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    xhr.onload = () => {
      if (xhr.status >= 400) {
        reject(xhr.response);
      } else {
        resolve(xhr.response);
      }
    };

    xhr.onerror = () => {
      reject('Something went wrong!');
    };

    xhr.send(JSON.stringify(data));
  });
  return promise;
};

/**
 * estimate credit
 */
function estimate() {
  var x = document.getElementById("estimate_credits");
  let params = new URLSearchParams(document.location.search.substring(1));
  let oid = parseInt(params.get("objectId"));
  console.log(oid);

  return sendHttpRequest('GET',
      'https://survey123.arcgis.com/api/featureReport/estimateCredits?featureLayerUrl=https://services5.arcgis.com/jMCHJcLe13FaKCFB/arcgis/rest/services/service_9f1cd3408c3042c8b29300a049a6469a/FeatureServer/0&queryParameters={"where": "objectId=' +
      oid + '"}&templateItemId=d6f2895b4a74492b9fdcab1d3eaa2f1f&token=' + token)
    .then(responseData => {
      console.log(responseData['resultInfo'].cost);
      
      document.getElementById("estimate_credits").innerHTML = responseData['resultInfo'].cost;
      
    });
};

/**
 * createReport
 */
function createReport() {
  let params = new URLSearchParams(document.location.search.substring(1));
  let oid = parseInt(params.get("objectId"));
  console.log(oid);

  return sendHttpRequest('POST', 'https://survey123.arcgis.com/api/featureReport/createReport/submitJob', {
      featureLayerUrl: 'https://services5.arcgis.com/jMCHJcLe13FaKCFB/arcgis/rest/services/service_9f1cd3408c3042c8b29300a049a6469a/FeatureServer/0',
      queryParameters: '{"where":"objectId=' + oid + '","orderByFields":"||EditDate DESC, objectid ASC"}',
      templateItemId: 'd6f2895b4a74492b9fdcab1d3eaa2f1f',
      token: token,
      surveyItemId: '02035e027391421494267c33dcb974e3',
      outputFormat: 'docx'
    })
    .then(responseData => {
      console.log(responseData);
      checkJobStatus(responseData['jobId'], token);
    })
    .catch(err => {
      console.log(err);
    });
};

/**
 * checkJobStatus
 */
function checkJobStatus(jobId, token) {
  return sendHttpRequest('GET', 'https://survey123.arcgis.com/api/featureReport/jobs/' + jobId + '?token=' + token)
    .then(
      responseData => {
        console.log(responseData);
        document.getElementById("generate_report").innerHTML = responseData['jobStatus'];
        if (responseData['jobStatus'] == 'esriJobExecuting') {
          document.getElementById("generate_report").innerHTML = responseData['jobStatus'];
          setTimeout(checkJobStatus(responseData['jobId'], token), 10000);
        } else if (responseData['jobStatus'] == 'esriJobSucceeded') {
          console.log(responseData['resultInfo'].resultFiles[0].url);
          // document.getElementById("generate_report").innerHTML = responseData['resultInfo'].resultFiles[0].url;
          document.getElementById("generate_report").innerHTML = "Download Report Here";
          document.getElementById("generate_report").href = responseData['resultInfo'].resultFiles[0].url;
        }
      });
};


estimateBtn.addEventListener('click', estimate);
reportBtn.addEventListener('click', createReport);
let uploadBtn, fileLoader, urlBtn, urlInput, inputImg, canvas, loading;

async function requestExternalImage(imageUrl) {
  const res = await fetch('fetch_external_image', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ imageUrl }),
  });
  if (!(res.status < 400)) {
    console.error(res.status + ' : ' + (await res.text()));
    throw new Error('failed to fetch image from url: ' + imageUrl);
  }

  let blob;
  try {
    blob = await res.blob();
    return await faceapi.bufferToImage(blob);
  } catch (e) {
    console.error('received blob:', blob);
    console.error('error:', e);
    throw new Error('failed to load image from url: ' + imageUrl);
  }
}

async function loadImageFromUrl(url) {
  const img = await requestExternalImage(url);
  inputImg.src = img.src;
  updateResults();
}

function saveFile(data, filename) {
  const save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  save_link.href = data;
  save_link.download = filename;

  const event = document.createEvent('MouseEvents');
  event.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null,
  );
  save_link.dispatchEvent(event);
}

function initDomAndEvents() {
    loading = document.getElementById('loading');
  uploadBtn = document.getElementById('upload');
  fileLoader = document.getElementById('file-input');
  urlBtn = document.getElementById('url-btn');
  urlInput = document.getElementById('imgUrlInput');
  inputImg = document.getElementById('inputImg');
  canvas = document.getElementById('overlay');
  download = document.getElementById('download');

  download.onclick = () => {
    const dataUrl = canvas.toDataURL('image/png');
    saveFile(dataUrl, 'avatar.png');
  };

  uploadBtn.onclick = () => fileLoader.click();
  urlBtn.onclick = () => {
    const url = urlInput.value;
    loadImageFromUrl(url);
  };
}

function readURL(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function(e) {
      inputImg.src = e.target.result;
      updateResults();
    };

    reader.readAsDataURL(input.files[0]);
  } else {
    alert('错误');
  }
}

async function updateResults() {
    // return 
  if (!isFaceDetectionModelLoaded()) {
    return;
  }
  loading.style.display = 'none';
  const results = await faceapi.detectAllFaces(inputImg).withFaceLandmarks();
  faceapi.matchDimensions(canvas, inputImg);
  const resizedResults = faceapi.resizeResults(results, inputImg);
  const info = getHatInfo(resizedResults);
  faceapi.draw.drawFaceLandmarks(canvas, resizedResults)  // 直接画出识别的的特征点
  drawing(canvas, {
    info,
    imgSrc: inputImg.src,
    width: canvas.width,
    height: canvas.height,
  });
}

async function run() {
  // 初始化face-api 这里使用ssd moblile
  await getCurrentFaceDetectionNet().load('/');
  // 加载Landmark模型
  await faceapi.loadFaceLandmarkModel('/');
  // 更新数据
  updateResults();
}

function ready(fn) {
  if (document.addEventListener) {
    document.addEventListener(
      'DOMContentLoaded',
      function() {
        //注销事件, 避免反复触发
        document.removeEventListener('DOMContentLoaded', arguments.callee, false);
        fn(); //执行函数
      },
      false,
    );
  } else if (document.attachEvent) {
    //IE
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState == 'complete') {
        document.detachEvent('onreadystatechange', arguments.callee);
        fn(); //函数执行
      }
    });
  }
}

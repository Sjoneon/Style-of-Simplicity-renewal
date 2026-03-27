const KAKAO_POSTCODE_SCRIPT_ID = 'kakao-postcode-script'
const KAKAO_POSTCODE_SCRIPT_SRC =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

function ensureKakaoPostcodeScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경이 아닙니다.'))
  }

  if (window.daum?.Postcode) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_POSTCODE_SCRIPT_ID)
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('카카오 주소검색 스크립트를 불러오지 못했습니다.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = KAKAO_POSTCODE_SCRIPT_ID
    script.src = KAKAO_POSTCODE_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('카카오 주소검색 스크립트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
}

export async function openKakaoPostcode(onComplete) {
  await ensureKakaoPostcodeScript()

  if (!window.daum?.Postcode) {
    throw new Error('카카오 주소검색 모듈이 준비되지 않았습니다.')
  }

  new window.daum.Postcode({
    oncomplete: (data) => {
      const mainAddress = String(data.roadAddress || data.jibunAddress || '').trim()
      const postcode = String(data.zonecode || '').trim()
      onComplete?.({
        postcode,
        address: mainAddress,
      })
    },
  }).open()
}

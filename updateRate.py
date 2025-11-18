import requests, time, json
import datetime, math


url = 'https://did-5.kw.ac.kr/vote/voteStatus/voteStatusBoard2.jsp'
extend = 'https://did-5.kw.ac.kr/vote/voteCommon/keepalive.jsp'

header = {
    'Cookie':'SESSION=NmZlODgzOTAtNTU3OS00ODRmLTk0NzgtZmZmMTM2M2YzYmIz; JSESSIONID=75DC85E83A18A989871D2956BB0BF25D',
    'Host':'did-5.kw.ac.kr',
    'Origin':'https://did-5.kw.ac.kr',
    'Sec-Fetch-Dest':'empty',
    'Sec-Fetch-Mode':'cors',
    'Sec-Fetch-Site':'same-origin',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
    'sec-ch-ua':'"Chromium";v="142", "Microsoft Edge";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile':'?0',
    'sec-ch-ua-platform':'"Windows"'
}
def getRate():
    rate = requests.get(url, headers=header).text
    rate = rate.split('제 10대 소프트웨어학부 선거</td>')[1].split('<td class="text-end align-middle">')[1].split('%')[0].strip()
    
    return rate

def extendSession():
    requests.post(extend, headers=header)

def main():
    while True:
        rate = float(getRate())

        ## MMDDHHMM
        ## set timezone to KST
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%m%d%H%M')


        
        data = json.loads(open("data.json", 'r', encoding='utf-8').read())
        data.append([rate, int(now)])
        data.sort(key=lambda x: x[1], reverse=True)
        open("data.json", 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=4))

        print(f'[{now}] 현재 투표율 {rate}% 기록 완료.')
        

        extendSession()
        time.sleep(60)  # 5분 대기
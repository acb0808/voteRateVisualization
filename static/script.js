document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    const chartElement = document.getElementById('chart');
    if (!chartElement) {
        console.error('Chart element not found!');
        return;
    }
    console.log('Chart element found:', chartElement);

    const chart = LightweightCharts.createChart(chartElement, {
        layout: {
            backgroundColor: '#05060a',
            textColor: '#555555',
            fontFamily: 'Noto Sans KR, sans-serif',
        },
        grid: {
            vertLines: {
                color: 'rgba(0, 0, 0, 0.08)',
                style: LightweightCharts.LineStyle.Dotted,
            },
            horzLines: {
                color: 'rgba(0, 0, 0, 0.08)',
                style: LightweightCharts.LineStyle.Dotted,
            },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Magnet,
            vertLine: {
                color: 'rgba(0, 0, 0, 0.3)',
                style: LightweightCharts.LineStyle.Solid,
                width: 1,
            },
            horzLine: {
                color: 'rgba(0, 0, 0, 0.3)',
                style: LightweightCharts.LineStyle.Solid,
                width: 1,
            },
        },
        rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.08)',
            scaleMargins: {
                top: 0.15,
                bottom: 0.08,
            },
        },
        timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.08)',
            timeVisible: true,
            secondsVisible: false,
            barSpacing: 10,
            rightOffset: 3,
            tickMarkFormatter: time => formatKoreanHour(time),
        },
    });

    const lineSeries = chart.addAreaSeries({
        lineColor: '#5de2e7',
        lineWidth: 2,
        topColor: 'rgba(93, 226, 231, 0.28)',
        bottomColor: 'rgba(93, 226, 231, 0.05)',
        priceLineVisible: false,
        priceFormat: {
            type: 'custom',
            formatter: value => `${value.toFixed(2)}%`,
        },
    });

    lineSeries.applyOptions({
        autoscaleInfoProvider: () => ({
            priceRange: {
                minValue: 0,
                maxValue: 40,
            },
        }),
    });

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip hidden';
    chartElement.appendChild(tooltip);

    console.log('Fetching data from /api/data...');
    fetch('/api/data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data fetched successfully:', data);
            if (!data || data.length === 0) {
                console.warn('Fetched data is empty or null.');
                return;
            }

            const formattedData = data.map(item => {
                const timeStr = String(item[1]);
                
                const month = parseInt(timeStr.slice(0, 2), 10) - 1;
                const day = parseInt(timeStr.slice(2, 4), 10);
                const hour = parseInt(timeStr.slice(4, 6), 10);
                const minute = parseInt(timeStr.slice(6, 8), 10);
                
                const date = new Date(Date.UTC(2025, month, day, hour, minute));
                // 한국 시간으로 변경
                
                // console.log('Parsed date:', date, 'from time string:', timeStr);
                
                return {
                    time: date.getTime() / 1000,
                    value: Math.ceil(item[0] * 431 / 100) / 431 * 100
                };
            }).reverse();

            console.log('Formatted data (first item):', formattedData[0]);
            console.log('Setting data to line series...');
            lineSeries.setData(formattedData);

            const lastPoint = formattedData[formattedData.length - 1];

            document.querySelector('.subtitle').innerHTML = '현재 투표율은 '+ lastPoint.value.toFixed(2) + '% ('+Math.round(lastPoint.value / 100 * 431)+'명)입니다.';

            lineSeries.createPriceLine({
                price: lastPoint.value,
                color: '#4bc0c0',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: '현재',
            });

            lineSeries.createPriceLine({
                price: 40,
                color: '#9e3333',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
            });

            chart.timeScale().fitContent();
            console.log('Data set and chart content fitted.');
            updateTooltip(lastPoint);
        })
        .catch(error => console.error('Error fetching or parsing data:', error));

    // Resize chart on window resize
    new ResizeObserver(entries => {
        if (entries.length > 0 && entries[0].contentRect) {
            const { width, height } = entries[0].contentRect;
            console.log(`Resizing chart to ${width}x${height}`);
            chart.resize(width, height);
        }
    }).observe(chartElement);

    function formatKoreanHour(time) {

        // 한국 시간으로 변경하기
        time -= 9 * 3600;

        const date = new Date(time * 1000);
        const hours = date.getHours();
        const period = hours < 12 ? '오전' : '오후';
        const hour12 = hours % 12 === 0 ? 12 : hours % 12;
        return `${period} ${hour12}시`;
    }

    const formatTooltip = ({ time, value }) => {

        const date = new Date(time * 1000);
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return {
            value: `${value.toFixed(2)}% (${Math.round(value / 100 * 431)}명)`,
            time: `${formatKoreanHour(time)} ${minutes}분`,
        };
    };

    const updateTooltip = dataPoint => {
        if (!dataPoint) {
            tooltip.classList.add('hidden');
            return;
        }

        const { value, time } = formatTooltip(dataPoint);
        tooltip.innerHTML = `
            <span class="tooltip-value">${value}</span>
            <span class="tooltip-time">${time}</span>
        `;
        tooltip.classList.remove('hidden');
    };

    const updateTooltipPosition = ({ x, y }) => {
        const rect = chartElement.getBoundingClientRect();
        const left = rect.left + window.scrollX + x;
        const top = rect.top + window.scrollY + y;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top - 20}px`;
    };

    chart.subscribeCrosshairMove(param => {
        if (!param.point || !param.time) {
            tooltip.classList.add('hidden');
            return;
        }

        const seriesData = param.seriesData.get(lineSeries);
        if (seriesData) {
            updateTooltipPosition(param.point);
            updateTooltip(seriesData);
        } else {
            tooltip.classList.add('hidden');
        }
    });
});
// 一、导航栏菜单点击交互
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    // 移除所有菜单项的active类
    menuItems.forEach(menu => menu.classList.remove('active'));
    // 给当前点击的菜单项添加active类
    item.classList.add('active');
  });
});

// 二、异常项按钮交互（点击反馈）
const alertBtns = document.querySelectorAll('.alert-btn');
alertBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    if (this.classList.contains('ignore')) {
      // 点击“忽略”，隐藏当前异常项
      this.closest('.alert-item').style.display = 'none';
    } else if (this.classList.contains('view')) {
      // 点击“查看”，弹出提示（后续可替换为弹窗详情）
      const alertText = this.closest('.alert-item').querySelector('span').textContent;
      alert(`查看异常详情：${alertText}`);
    }
  });
});

// 三、ECharts图表初始化（用户增长折线图）
const userGrowthChart = echarts.init(document.getElementById('userGrowthChart'));
// 折线图配置（主题色适配）
const userGrowthOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['1日', '5日', '10日', '15日', '20日', '25日', '30日'],
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#6b7280' }
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#6b7280' },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: [{
    data: [120, 200, 360, 210, 450, 320, 580],
    type: 'line',
    smooth: true,
    lineStyle: { width: 3, color: '#8CB01E' }, // 主题色2
    itemStyle: { color: '#386230', borderColor: '#8CB01E', borderWidth: 2 }, // 主题色1+2
    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: 'rgba(140, 176, 30, 0.3)' },
      { offset: 1, color: 'rgba(140, 176, 30, 0)' }
    ]) }
  }]
};
// 渲染折线图
userGrowthChart.setOption(userGrowthOption);

// 四、ECharts图表初始化（功能使用占比饼图）
const functionRatioChart = echarts.init(document.getElementById('functionRatioChart'));
// 饼图配置（主题色适配）
const functionRatioOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    textStyle: { color: '#6b7280' }
  },
  series: [{
    name: '功能使用占比',
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: {
      borderRadius: 8,
      borderColor: '#fff',
      borderWidth: 2
    },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14 } },
    labelLine: { show: false },
    data: [
      { value: 35, name: '植物档案管理', itemStyle: { color: '#386230' } }, // 主题色1
      { value: 25, name: 'AI助手咨询', itemStyle: { color: '#8CB01E' } }, // 主题色2
      { value: 20, name: '种植日记上传', itemStyle: { color: '#F8D785' } }, // 主题色3
      { value: 15, name: '用户信息修改', itemStyle: { color: '#ED976B' } }, // 主题色4
      { value: 5, name: '其他功能', itemStyle: { color: '#9ca3af' } }
    ]
  }]
};
// 渲染饼图
functionRatioChart.setOption(functionRatioOption);

// 五、窗口大小变化时，自适应图表尺寸
window.addEventListener('resize', () => {
  userGrowthChart.resize();
  functionRatioChart.resize();
});
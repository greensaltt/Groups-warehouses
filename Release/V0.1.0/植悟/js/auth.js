// 登录逻辑（支持密码登录/验证码登录）
export function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value.trim();
        const captcha = document.getElementById('captcha').value.trim();
        const loginType = document.querySelector('.login-tab.active')?.dataset.type || 'phone_pwd';

        // 表单验证
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的11位手机号');
            return;
        }

        if (loginType === 'phone_pwd' && (!password || password.length < 8 || !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password))) {
            alert('密码需8位以上，且包含字母和数字');
            return;
        }

        if (loginType === 'phone_code' && (captcha.length !== 6 || captcha !== '123456')) {
            alert('验证码错误（模拟正确验证码：123456）');
            return;
        }

        // 模拟登录成功，存储用户信息
        const user = {
            id: Date.now().toString(),
            phone: phone,
            nickname: '植物爱好者',
            avatar: '',
            token: `mock_token_${Date.now()}`,
            expireTime: new Date().getTime() + 7200000 // token有效期2小时
        };
        localStorage.setItem('zhiwu_user', JSON.stringify(user));
        alert('登录成功！');
        window.location.href = 'index.html';
    });

    // 验证码登录/密码登录切换
    const loginTabs = document.querySelectorAll('.login-tab');
    loginTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            loginTabs.forEach(t => t.classList.remove('active', 'text-primary', 'border-b-2', 'border-primary'));
            tab.classList.add('active', 'text-primary', 'border-b-2', 'border-primary');
            
            const isCodeLogin = tab.dataset.type === 'phone_code';
            document.getElementById('passwordGroup').classList.toggle('hidden', isCodeLogin);
            document.getElementById('captchaGroup').classList.toggle('hidden', !isCodeLogin);
            document.getElementById('rememberLabel').classList.toggle('hidden', isCodeLogin);
        });
    });

    // 显示/隐藏密码
    const showPwdBtn = document.getElementById('showPwd');
    showPwdBtn?.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        showPwdBtn.innerHTML = type === 'password' ? '<<i class="bi bi-eye-slash"></</i>' : '<<i class="bi bi-eye"></</i>';
    });

    // 模拟获取验证码
    const getCaptchaBtn = document.getElementById('getCaptcha');
    getCaptchaBtn?.addEventListener('click', () => {
        const phone = document.getElementById('phone').value.trim();
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的手机号');
            return;
        }

        // 倒计时逻辑
        getCaptchaBtn.disabled = true;
        getCaptchaBtn.textContent = '60秒后重新获取';
        let count = 60;
        const timer = setInterval(() => {
            count--;
            getCaptchaBtn.textContent = `${count}秒后重新获取`;
            if (count === 0) {
                clearInterval(timer);
                getCaptchaBtn.disabled = false;
                getCaptchaBtn.textContent = '获取验证码';
            }
        }, 1000);

        alert('验证码已发送至你的手机（模拟验证码：123456）');
    });
}

// 注册逻辑
export function initRegister() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = document.getElementById('regPhone').value.trim();
        const captcha = document.getElementById('captcha').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const confirmPwd = document.getElementById('confirmPassword').value.trim();

        // 表单验证
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的11位手机号');
            return;
        }

        if (captcha.length !== 6 || captcha !== '123456') {
            alert('验证码错误（模拟正确验证码：123456）');
            return;
        }

        if (password.length < 8 || !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password)) {
            alert('密码需8位以上，且包含字母和数字');
            return;
        }

        if (password !== confirmPwd) {
            alert('两次密码输入不一致');
            return;
        }

        // 模拟注册成功
        const user = {
            id: Date.now().toString(),
            phone: phone,
            nickname: '植物爱好者',
            avatar: '',
            token: `mock_token_${Date.now()}`,
            expireTime: new Date().getTime() + 7200000
        };
        localStorage.setItem('zhiwu_user', JSON.stringify(user));
        alert('注册成功！即将跳转至首页');
        window.location.href = 'index.html';
    });

    // 显示/隐藏注册密码
    const showRegPwdBtn = document.getElementById('showRegPwd');
    showRegPwdBtn?.addEventListener('click', () => {
        const regPasswordInput = document.getElementById('regPassword');
        const type = regPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        regPasswordInput.setAttribute('type', type);
        showRegPwdBtn.innerHTML = type === 'password' ? '<<i class="bi bi-eye-slash"></</i>' : '<<i class="bi bi-eye"></</i>';
    });

    // 模拟获取注册验证码
    const getRegCaptchaBtn = document.getElementById('getCaptcha');
    getRegCaptchaBtn?.addEventListener('click', () => {
        const phone = document.getElementById('regPhone').value.trim();
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的手机号');
            return;
        }

        getRegCaptchaBtn.disabled = true;
        getRegCaptchaBtn.textContent = '60秒后重新获取';
        let count = 60;
        const timer = setInterval(() => {
            count--;
            getRegCaptchaBtn.textContent = `${count}秒后重新获取`;
            if (count === 0) {
                clearInterval(timer);
                getRegCaptchaBtn.disabled = false;
                getRegCaptchaBtn.textContent = '获取验证码';
            }
        }, 1000);

        alert('验证码已发送至你的手机（模拟验证码：123456）');
    });
}

// 修改密码逻辑
export function initChangePassword() {
    const passwordForm = document.getElementById('passwordForm');
    if (!passwordForm) return;

    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const oldPassword = document.getElementById('oldPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

        // 模拟原密码验证（实际对接后端时替换为接口请求）
        if (oldPassword !== '12345678') { // 模拟原密码为12345678
            alert('原密码错误');
            return;
        }

        if (newPassword.length < 8 || !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(newPassword)) {
            alert('新密码需8位以上，且包含字母和数字');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('两次新密码输入不一致');
            return;
        }

        if (newPassword === oldPassword) {
            alert('新密码不能与原密码相同');
            return;
        }

        // 模拟密码修改成功
        alert('密码修改成功！请重新登录');
        logout();
    });

    // 取消修改密码
    const cancelBtn = document.getElementById('cancelChangePwdBtn');
    cancelBtn?.addEventListener('click', () => {
        document.getElementById('changePasswordForm').classList.add('hidden');
        passwordForm.reset();
    });
}

// 编辑个人资料逻辑
export function initEditProfile() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nickname = document.getElementById('editNickname').value.trim();
        const signature = document.getElementById('editSignature').value.trim();

        if (!nickname) {
            alert('请输入昵称');
            return;
        }

        if (signature.length > 50) {
            alert('个性签名不能超过50字');
            return;
        }

        // 更新用户信息
        const user = JSON.parse(localStorage.getItem('zhiwu_user')) || {};
        user.nickname = nickname;
        user.signature = signature;
        localStorage.setItem('zhiwu_user', JSON.stringify(user));

        // 刷新页面显示
        document.getElementById('userNickname').textContent = nickname;
        hideEditProfileModal();
        alert('资料修改成功！');
    });

    // 更换头像
    const avatarUpload = document.getElementById('avatarUpload');
    avatarUpload?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 模拟图片上传
        const reader = new FileReader();
        reader.onload = (res) => {
            const user = JSON.parse(localStorage.getItem('zhiwu_user')) || {};
            user.avatar = res.target.result;
            localStorage.setItem('zhiwu_user', JSON.stringify(user));
            document.getElementById('avatarContainer').innerHTML = `<img src="${res.target.result}" alt="用户头像" class="w-full h-full object-cover">`;
            alert('头像更换成功！');
        };
        reader.readAsDataURL(file);
    });
}

// 页面加载时初始化对应功能
window.addEventListener('load', () => {
    if (window.location.pathname.includes('login.html')) {
        initLogin();
    } else if (window.location.pathname.includes('register.html')) {
        initRegister();
    } else if (window.location.pathname.includes('profile.html')) {
        initChangePassword();
        initEditProfile();
    }
});
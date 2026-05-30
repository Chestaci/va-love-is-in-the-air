document.addEventListener('DOMContentLoaded', function() {

    // 1. ПЕРЕКЛЮЧЕНИЕ ГОСТЕЙ
    function toggleGuestFields() {
        const count = parseInt(document.getElementById('guestCount')?.value) || 1;
        for (let i = 2; i <= 4; i++) {
            const block = document.getElementById(`guest${i}`);
            if (!block) continue;

            const fields = block.querySelectorAll('input, select, textarea');

            if (i <= count) {
                block.style.display = 'block';
                // ✅ Включаем поля для отправки
                fields.forEach(f => {
                    f.disabled = false;
                    if (f.type === 'text') f.required = true;
                });
            } else {
                block.style.display = 'none';
                // 🚫 ОТКЛЮЧАЕМ: браузер НЕ добавит их в FormData
                fields.forEach(f => {
                    f.disabled = true;
                    if (f.type === 'text') { f.required = false; f.value = ''; }
                    if (f.tagName === 'SELECT') f.selectedIndex = 0;
                    if (f.type === 'checkbox') f.checked = false;
                    if (f.tagName === 'TEXTAREA') f.value = '';
                });
            }
        }
    }

    const guestSelect = document.getElementById('guestCount');
    if (guestSelect) {
        guestSelect.addEventListener('change', toggleGuestFields);
        toggleGuestFields(); // Инициализация при загрузке
    }

    // 2. НАДЁЖНАЯ ОТПРАВКА
    function initForm(formId, btnId, successId) {
        const form = document.getElementById(formId);
        const btn = document.getElementById(btnId);
        const success = document.getElementById(successId);

        if (!form || !btn || !success) {
            console.warn(`⚠️ Форма ${formId} не найдена в HTML`);
            return;
        }

        const originalBtnText = btn.getAttribute('data-orig') || btn.textContent;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            btn.disabled = true;
            btn.textContent = 'Отправка... 💜';

            const formData = new FormData(form);
            const actionUrl = form.action;

                    try {
            // ✅ ОБЯЗАТЕЛЬНО для Google Forms!
            // Браузер не будет блокировать запрос из-за CORS, 
            // данные уйдут в таблицу, а JS продолжит выполнение
            await fetch(actionUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' 
            });

            // Если дошли сюда → запрос ушёл успешно
            const card = form.querySelector('.form-card');
            if (card) card.style.display = 'none';
            
            success.style.display = 'block';
            success.style.opacity = '0';
            setTimeout(() => { success.style.transition = 'opacity 0.5s'; success.style.opacity = '1'; }, 50);
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Очистка формы и сброс к 1 гостю
            form.reset();
            toggleGuestFields(); 
            
            // Защита от автозаполнения при обновлении
            if (window.history.replaceState) {
                window.history.replaceState({}, '', window.location.pathname);
            }

            console.log(`✅ Форма ${formId} успешно отправлена`);

        } catch (err) {
            // Попадаем сюда ТОЛЬКО при реальной ошибке сети или валидации
            console.error('❌ Ошибка отправки:', err);
            alert('Не удалось отправить форму. Проверьте интернет или попробуйте позже.');
            btn.disabled = false;
            btn.textContent = originalBtnText;
        }
        });
    }

    initForm('rsvpForm', 'rsvpSubmitBtn', 'formSuccess');
    initForm('songForm', 'songSubmitBtn', 'songSuccess');
});

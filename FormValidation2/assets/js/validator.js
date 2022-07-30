function Validator(formSelector) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    const formRules = {};

    /**
     * Quy ước tạo rule
     * - Nếu có lỗi return `error message`
     * - Nếu không có lỗi return `undefined`
     */
    const validatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này';
        },
        email: function (value) {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Trường này phải là email';
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} ký tự`;
            };
        },
        max: function (max) {
            return function (value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} ký tự`;
            };
        },
    }

    // Lấy ra form element trong DOM theo `formSelector`
    const formElement = document.querySelector(formSelector);

    // Chỉ xử lý khi có element trong DOM
    if (formElement) {
        const inputs = formElement.querySelectorAll('[name][rules]');

        for (const input of inputs) {
            const rules = input.getAttribute('rules').split('|');

            for (let rule of rules) {
                const ruleHasValue = rule.includes(':');
                let ruleInfo;

                if (ruleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }

                let ruleFunc = validatorRules[rule];

                if (ruleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate (blur, change, ...)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // Hàm thực hiện validate
        function handleValidate(event) {
            const rules = formRules[event.target.name];
            let errorMessage;

            for (const rule of rules) {
                errorMessage = rule(event.target.value);
                if (errorMessage) break;
            }

            // Nếu có lỗi thì hiển thị message lỗi ra UI
            if (errorMessage) {
                const formGroup = getParent(event.target, '.form-group');
                if (formGroup) {
                    formGroup.classList.add('invalid');
                    const formMessage = formGroup.querySelector('.form-message');
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }

        // Hàm clear message lỗi 
        function handleClearError(event) {
            const formGroup = getParent(event.target, '.form-group');
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');

                const formMessage = formGroup.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }
        }

        // Xử lý hành vi submit form 
        formElement.onsubmit = (event) => {
            event.preventDefault();

            const inputs = formElement.querySelectorAll('[name][rules]');
            let isValid = true;

            for (const input of inputs) {
                if (!handleValidate({ target: input })) {
                    isValid = false;
                }
            }

            // Khi không có lỗi thì submit form
            if (isValid) {
                if (typeof this.onSubmit === 'function') {
                    // Select tất cả field có attribute là name
                    const enableInputs = formElement.querySelectorAll('[name]');

                    // anableInputs là nodeList nên dùng Array.from để convert sang array
                    const formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector(`input[name="${input.name}"]:checked`)?.value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                };

                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }

                                values[input.name].push(input.value);
                                break;
                            case 'file': {
                                values[input.name] = input.files;
                                break;
                            }
                            default:
                                values[input.name] = input.value;
                                break;
                        }
                        return values;
                    }, {});

                    // Gọi  lại hàm onSubmit và trả về giá trị của form
                    return this.onSubmit(formValues);
                }
                formElement.submit();
            }
        }
    }
}
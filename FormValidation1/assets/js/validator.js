
// Đối tượng `Validator`
function Validator(options) {
    // Lấy element của form cần validate
    const formElement = document.querySelector(options.form);
    const selectorRules = {};

    function getParent(element, selector) {
        // Nếu element có thể cha tìm <> nếu không dừng
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }


    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        const errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        let errorMessage;

        // Lấy ra các rules của selector
        const rules = selectorRules[rule.selector];

        // Lập qua từng rule và kiểm tra
        for (let index = 0; index < rules.length; ++index) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[index](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[index](inputElement.value);
                    break;
            }
            // Nếu có lỗi => dừng việc kiểm tra
            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return !errorMessage;
    }

    if (formElement) {
        formElement.onsubmit = function (e) {
            e.preventDefault();

            let isFormValid = true;

            // Lặp qua từng rules và validates
            options.rules.forEach(function (rule) {
                const inputElement = formElement.querySelector(rule.selector);
                const isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });

            if (isFormValid) {
                // Trường hợp submit với js
                if (typeof options.onSubmit === 'function') {
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

                    options.onSubmit(formValues);
                }
                // Trường hợp submit với hành vi mặt định
                else {
                    formElement.submit();
                }
            }
        }

        // Xử lý lập qua mỗi rule và xử lý (lắng nghe sự kiện blur, input, ...)
        options.rules.forEach(function (rule) {
            // Lưu lại các rule cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                // Từ lần chạy 2 trở đi nó đã là mảng nên push thêm phần tử vào mảng có key = rule.selector
                selectorRules[rule.selector].push(rule.test);
            } else {
                // Lần đầu chưa là mảng thì gán [key] = [value] cho nó thành mảng
                selectorRules[rule.selector] = [rule.test];
            }

            const inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(function (inputElement) {
                // Xử lý trường hợp blur khỏi input
                inputElement.onblur = () => {
                    validate(inputElement, rule);
                }

                // Xử lý mỗi khi người dùng đang nhập vào input sẽ xóa thông báo lỗi
                inputElement.oninput = () => {
                    const errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                }
            });
        });
    }
}

// Định nghĩa rules
/**
 * Nguyên tắc của các rules:
 * 1. Khi có lỗi => Trả ra message lỗi
 * 2. Khi hợp lệ => Không trả (undefined)
 */
Validator.isRequired = function (selector, message) {
    return {
        selector,
        test: function (value) {
            return value ? undefined : message || 'Vui lòng nhập trường này';
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector,
        test: function (value) {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email';
        }
    }
}

Validator.minLength = function (selector, min, message) {
    return {
        selector,
        test: function (value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} ký tự`;
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác';
        }
    }
}
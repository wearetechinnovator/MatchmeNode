const detectEmailPhone = (emailPhone) => {
    const emailRegx = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegx = /^[0-9]{10}$/;


    if (emailPhone.includes("@") && emailPhone.includes(".")) {
        if (!emailRegx.test(emailPhone)) {
            return { type: "email", msg: 'Invalid email' }
        }

        return { type: "email" }

    } else {
        if (!phoneRegx.test(emailPhone)) {
            return { type: "phone", msg: "Invalid Phone number" };
        }

        return { type: "phone" };
    }

}


module.exports = detectEmailPhone;

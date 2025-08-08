const detectEmailPhone = (emailPhone) => {

    if (emailPhone.includes("@") && emailPhone.includes(".")) {
        return { type: "email" }
    } else {
        const phone = emailPhone;
        if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            return { type: "phone", msg: "Invalid Phone number" };
        }
        return { type: "phone" };
    }

}


console.log(detectEmailPhone("2154547845"));

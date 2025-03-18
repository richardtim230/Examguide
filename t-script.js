document.addEventListener("DOMContentLoaded", () => {
    let user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "login.html";
    } else {
        updateUserInfo();
    }

    document.getElementById("recharge-btn").addEventListener("click", () => {
        document.getElementById("recharge-section").classList.toggle("hidden");
    });

    document.getElementById("redeem-btn").addEventListener("click", () => {
        document.getElementById("redeem-section").classList.toggle("hidden");
    });

    document.getElementById("generate-pin-btn").addEventListener("click", () => {
        const amount = parseInt(document.getElementById("recharge-amount").value);
        if (amount > 0) {
            const pin = generateRechargePin(amount);
            document.getElementById("generated-pin").textContent = `Generated Pin: ${pin}`;
            alert(`Send the following details via WhatsApp to Admin:
            Name: ${user.fullName}
            Dept: ${user.department}
            Phone: ${user.phone}
            Amount: ₦${amount}
            Recharge Pin: ${pin}
            Payment to: Opay 9070962822 (Ochuko Timothy)`);
        }
    });

    document.getElementById("redeem-credits-btn").addEventListener("click", () => {
        const pin = document.getElementById("redeem-pin").value;
        if (pin && validateRechargePin(pin)) {
            const amount = parseInt(pin.split("-")[1]);
            if (!user.usedPins.includes(pin)) {
                user.credits += (amount * 2);
                user.usedPins.push(pin);
                localStorage.setItem("user", JSON.stringify(user));
                updateUserInfo();
                alert(`Recharge Successful! You now have ${user.credits} credits.`);
            } else {
                alert("This PIN has already been used.");
            }
        } else {
            alert("Invalid or Unverified PIN.");
        }
    });

    document.getElementById("start-test-btn").addEventListener("click", () => {
        if (user.credits >= 10) {
            user.credits -= 10;
            localStorage.setItem("user", JSON.stringify(user));
            updateUserInfo();
            alert("Test started! 10 credits deducted.");
        } else {
            alert("Insufficient credits! Please recharge.");
        }
    });
});

function validateRechargePin(pin) {
    return pin.match(/^\d{8}-\d+$/);
}

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("full-name").textContent = user.fullName;
    document.getElementById("credit-points").textContent = user.credits;
}

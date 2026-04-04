(() => {
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const percentFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero"
  });

  function formatCurrency(value) {
    return currencyFormatter.format(Number.isFinite(value) ? value : 0);
  }

  function formatPercent(value) {
    const safe = Number.isFinite(value) ? value : 0;
    return `${percentFormatter.format(safe)}%`;
  }

  function setToneClass(element, value) {
    element.classList.remove("tone-negative", "tone-positive", "tone-neutral");
    if (value > 0.000001) {
      element.classList.add("tone-positive");
    } else if (value < -0.000001) {
      element.classList.add("tone-negative");
    } else {
      element.classList.add("tone-neutral");
    }
  }

  function initializeCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const text = button.getAttribute("data-copy") || "";
        const original = button.dataset.original || button.textContent;
        button.dataset.original = original;

        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
        } catch (error) {
          button.textContent = "Copy failed";
        }

        window.setTimeout(() => {
          button.textContent = original;
        }, 1600);
      });
    });
  }

  function initializeCalculator() {
    const capitalInput = document.getElementById("capitalInput");
    if (!capitalInput) {
      return;
    }

    const modeSelect = document.getElementById("modeSelect");
    const percentField = document.getElementById("percentField");
    const ratioField = document.getElementById("ratioField");
    const percentInput = document.getElementById("percentInput");
    const ratioInput = document.getElementById("ratioInput");
    const feeInput = document.getElementById("feeInput");
    const ratioPreview = document.getElementById("ratioPreview");
    const holdValue = document.getElementById("holdValue");
    const lpBeforeFees = document.getElementById("lpBeforeFees");
    const lpAfterFees = document.getElementById("lpAfterFees");
    const ilPercent = document.getElementById("ilPercent");
    const ilDollar = document.getElementById("ilDollar");
    const netVsHold = document.getElementById("netVsHold");
    const breakevenFees = document.getElementById("breakevenFees");
    const explanation = document.getElementById("explanation");

    function toggleMode() {
      const usePercent = modeSelect.value === "percent";
      percentField.classList.toggle("is-hidden", !usePercent);
      ratioField.classList.toggle("is-hidden", usePercent);
    }

    function readNumber(input) {
      return Number.parseFloat(input.value);
    }

    function writeInvalid(message) {
      holdValue.textContent = "--";
      lpBeforeFees.textContent = "--";
      lpAfterFees.textContent = "--";
      ilPercent.textContent = "--";
      ilDollar.textContent = message;
      netVsHold.textContent = "--";
      breakevenFees.textContent = "--";
      explanation.textContent = message;
      ratioPreview.textContent = "";
      setToneClass(netVsHold, 0);
      setToneClass(ilPercent, 0);
    }

    function update() {
      toggleMode();

      const capital = readNumber(capitalInput);
      const percentMove = readNumber(percentInput);
      const ratioMove = readNumber(ratioInput);
      const fees = Number.isFinite(readNumber(feeInput)) ? readNumber(feeInput) : 0;

      if (!Number.isFinite(capital) || capital <= 0) {
        writeInvalid("Enter a starting capital above zero.");
        return;
      }

      let ratio = ratioMove;
      if (modeSelect.value === "percent") {
        if (!Number.isFinite(percentMove) || percentMove <= -100) {
          writeInvalid("Percent change must be above -100%.");
          return;
        }
        ratio = 1 + percentMove / 100;
        ratioPreview.textContent = `Price ratio: ${ratio.toFixed(4)}x`;
      } else {
        if (!Number.isFinite(ratioMove) || ratioMove <= 0) {
          writeInvalid("Final price ratio must be above zero.");
          return;
        }
        ratioPreview.textContent = `Percent move: ${formatPercent((ratioMove - 1) * 100)}`;
      }

      const hold = capital * (1 + ratio) / 2;
      const lpBefore = capital * Math.sqrt(ratio);
      const lpAfter = lpBefore + fees;
      const lossDollar = hold - lpBefore;
      const lossPercent = hold === 0 ? 0 : (lossDollar / hold) * 100;
      const netAfterFees = lpAfter - hold;

      holdValue.textContent = formatCurrency(hold);
      lpBeforeFees.textContent = formatCurrency(lpBefore);
      lpAfterFees.textContent = formatCurrency(lpAfter);
      ilPercent.textContent = formatPercent(lossPercent);
      ilDollar.textContent = `${formatCurrency(lossDollar)} behind hold before fees`;
      netVsHold.textContent = formatCurrency(netAfterFees);
      breakevenFees.textContent = formatCurrency(lossDollar);

      setToneClass(netVsHold, netAfterFees);
      setToneClass(ilPercent, lossPercent === 0 ? 0 : -lossPercent);

      const moveText = modeSelect.value === "percent"
        ? `${formatPercent(percentMove)}`
        : `${ratio.toFixed(2)}x`;

      const feeLine = fees === 0
        ? "No fee offset was added."
        : `After ${formatCurrency(fees)} in fee or incentive income, the LP result moves to ${formatCurrency(lpAfter)}.`;

      const comparisonLine = netAfterFees >= 0
        ? `That is ${formatCurrency(netAfterFees)} ahead of simple hold.`
        : `That is still ${formatCurrency(Math.abs(netAfterFees))} behind simple hold.`;

      explanation.textContent = `If token A moves ${moveText} against token B, simple hold finishes at ${formatCurrency(hold)}. The 50/50 LP finishes at ${formatCurrency(lpBefore)} before fees because the pool keeps selling some of the winner into the loser as price moves. That leaves an impermanent loss gap of ${formatPercent(lossPercent)} or ${formatCurrency(lossDollar)}. ${feeLine} ${comparisonLine}`;
    }

    [capitalInput, modeSelect, percentInput, ratioInput, feeInput].forEach((element) => {
      element.addEventListener("input", update);
      element.addEventListener("change", update);
    });

    document.querySelectorAll(".example-chip").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-mode");
        const value = button.getAttribute("data-value");
        if (mode === "percent") {
          modeSelect.value = "percent";
          percentInput.value = value || "0";
        } else {
          modeSelect.value = "ratio";
          ratioInput.value = value || "1";
        }
        update();
      });
    });

    update();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeCopyButtons();
    initializeCalculator();
  });
})();

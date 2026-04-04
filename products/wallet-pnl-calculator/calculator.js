(() => {
  function calculateMetrics({ deposits, withdrawals, holdingsValue, holdingsCostBasis }) {
    const values = [deposits, withdrawals, holdingsValue, holdingsCostBasis];
    if (values.some((value) => !Number.isFinite(value))) {
      return { ok: false, error: "Enter real numbers in every field." };
    }
    if (values.some((value) => value < 0)) {
      return { ok: false, error: "Use zero or positive numbers for this rough check." };
    }
    if (holdingsCostBasis > deposits + 0.000001) {
      return {
        ok: false,
        error: "Current holdings cost basis cannot be higher than total deposits for this model. If it is, widen the deposit figure or treat the wallet scope differently."
      };
    }

    const totalPnl = withdrawals + holdingsValue - deposits;
    const netCapitalInPlay = deposits - withdrawals;
    const realizedCostBasis = deposits - holdingsCostBasis;
    const realizedPnl = withdrawals - realizedCostBasis;
    const unrealizedPnl = holdingsValue - holdingsCostBasis;
    const totalReturnPct = deposits > 0 ? (totalPnl / deposits) * 100 : null;
    const mathCheck = realizedPnl + unrealizedPnl;

    return {
      ok: true,
      deposits,
      withdrawals,
      holdingsValue,
      holdingsCostBasis,
      totalPnl,
      netCapitalInPlay,
      realizedCostBasis,
      realizedPnl,
      unrealizedPnl,
      totalReturnPct,
      mathCheck,
      mathGap: mathCheck - totalPnl
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calculateMetrics };
  }

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

  function initializeCalculator() {
    const depositsInput = document.getElementById("depositsInput");
    if (!depositsInput) {
      return;
    }

    const withdrawalsInput = document.getElementById("withdrawalsInput");
    const holdingsValueInput = document.getElementById("holdingsValueInput");
    const holdingsBasisInput = document.getElementById("holdingsBasisInput");
    const totalPnl = document.getElementById("totalPnl");
    const totalReturnPct = document.getElementById("totalReturnPct");
    const returnNote = document.getElementById("returnNote");
    const netCapital = document.getElementById("netCapital");
    const realizedBasis = document.getElementById("realizedBasis");
    const realizedPnl = document.getElementById("realizedPnl");
    const unrealizedPnl = document.getElementById("unrealizedPnl");
    const consistencyNote = document.getElementById("consistencyNote");
    const explanation = document.getElementById("explanation");

    function readNumber(input) {
      return Number.parseFloat(input.value);
    }

    function writeInvalid(message) {
      totalPnl.textContent = "--";
      totalReturnPct.textContent = "--";
      netCapital.textContent = "--";
      realizedBasis.textContent = "--";
      realizedPnl.textContent = "--";
      unrealizedPnl.textContent = "--";
      returnNote.textContent = "Return % is shown only when the inputs make sense.";
      consistencyNote.textContent = "";
      explanation.textContent = message;
      [totalPnl, totalReturnPct, netCapital, realizedBasis, realizedPnl, unrealizedPnl].forEach((element) => {
        element.classList.remove("tone-negative", "tone-positive");
        element.classList.add("tone-neutral");
      });
    }

    function update() {
      const result = calculateMetrics({
        deposits: readNumber(depositsInput),
        withdrawals: readNumber(withdrawalsInput),
        holdingsValue: readNumber(holdingsValueInput),
        holdingsCostBasis: readNumber(holdingsBasisInput)
      });

      if (!result.ok) {
        writeInvalid(result.error);
        return;
      }

      totalPnl.textContent = formatCurrency(result.totalPnl);
      totalReturnPct.textContent = result.totalReturnPct === null ? "n/a" : formatPercent(result.totalReturnPct);
      returnNote.textContent = result.totalReturnPct === null
        ? "Return % needs deposits above zero."
        : "Relative to total deposits.";
      netCapital.textContent = formatCurrency(result.netCapitalInPlay);
      realizedBasis.textContent = formatCurrency(result.realizedCostBasis);
      realizedPnl.textContent = formatCurrency(result.realizedPnl);
      unrealizedPnl.textContent = formatCurrency(result.unrealizedPnl);

      setToneClass(totalPnl, result.totalPnl);
      setToneClass(totalReturnPct, result.totalReturnPct ?? 0);
      setToneClass(netCapital, 0);
      setToneClass(realizedBasis, 0);
      setToneClass(realizedPnl, result.realizedPnl);
      setToneClass(unrealizedPnl, result.unrealizedPnl);

      consistencyNote.textContent = `Math check: ${formatCurrency(result.realizedPnl)} realized + ${formatCurrency(result.unrealizedPnl)} unrealized = ${formatCurrency(result.totalPnl)} total P&L.`;

      const returnLine = result.totalReturnPct === null
        ? "Return percent is not shown because deposits are zero."
        : `That works out to ${formatPercent(result.totalReturnPct)} on total deposits.`;

      const capitalLine = result.netCapitalInPlay > 0
        ? `${formatCurrency(result.netCapitalInPlay)} of the original capital figure is still in play.`
        : result.netCapitalInPlay < 0
          ? `You have already pulled out ${formatCurrency(Math.abs(result.netCapitalInPlay))} more than the original capital figure.`
          : "You have already pulled out exactly the same amount as the original capital figure.";

      explanation.textContent = `You have put in ${formatCurrency(result.deposits)}, taken out ${formatCurrency(result.withdrawals)}, and the wallet is now worth ${formatCurrency(result.holdingsValue)}. That puts total wallet P&L at ${formatCurrency(result.totalPnl)}. ${returnLine} Based on a remaining holdings cost basis of ${formatCurrency(result.holdingsCostBasis)}, about ${formatCurrency(result.realizedCostBasis)} of basis has already been realized. That makes realized P&L ${formatCurrency(result.realizedPnl)} and unrealized P&L ${formatCurrency(result.unrealizedPnl)}. ${capitalLine} Exclude transfers between your own wallets if you want this rough split to stay meaningful.`;
    }

    [depositsInput, withdrawalsInput, holdingsValueInput, holdingsBasisInput].forEach((element) => {
      element.addEventListener("input", update);
      element.addEventListener("change", update);
    });

    document.querySelectorAll(".example-chip").forEach((button) => {
      button.addEventListener("click", () => {
        depositsInput.value = button.getAttribute("data-deposits") || "0";
        withdrawalsInput.value = button.getAttribute("data-withdrawals") || "0";
        holdingsValueInput.value = button.getAttribute("data-holdings") || "0";
        holdingsBasisInput.value = button.getAttribute("data-basis") || "0";
        update();
      });
    });

    update();
  }

  if (typeof window !== "undefined") {
    window.walletPnlCalculator = { calculateMetrics };
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializeCalculator);
  }
})();

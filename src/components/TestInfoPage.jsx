import React from 'react';

const TestInfoPage = () => {
  return (
    <div className="p-6 space-y-10">
      <section>
        <h1 className="text-2xl font-bold">Top 5 Tests</h1>
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <h2 className="font-semibold">ADP Standard Test (Actual Deferral Percentage Test)</h2>
            <p><strong>Purpose:</strong> Ensures that highly compensated employees (HCEs) do not contribute disproportionately more to the 401(k) plan than non-highly compensated employees (NHCEs).</p>
            <p><strong>What It Does:</strong> Compares average deferral percentages of HCEs and NHCEs. If the difference is too great, corrective action is required.</p>
            <p><strong>Why It Matters:</strong> Promotes fairness in retirement contributions.</p>
          </li>
          <li>
            <h2 className="font-semibold">ACP Standard Test (Actual Contribution Percentage Test)</h2>
            <p><strong>Purpose:</strong> Similar to the ADP test, but evaluates employer matching and after-tax contributions.</p>
            <p><strong>What It Does:</strong> Compares average contribution percentages from matching and after-tax contributions between HCEs and NHCEs.</p>
            <p><strong>Why It Matters:</strong> Prevents discrimination in plan benefits.</p>
          </li>
          <li>
            <h2 className="font-semibold">Coverage Test</h2>
            <p><strong>Purpose:</strong> Checks whether the plan covers a sufficient number of NHCEs relative to HCEs.</p>
            <p><strong>What It Does:</strong> Uses the Ratio Percentage or Average Benefits Test to ensure compliance.</p>
            <p><strong>Why It Matters:</strong> Ensures broad, nondiscriminatory participation.</p>
          </li>
          <li>
            <h2 className="font-semibold">Top-Heavy Test</h2>
            <p><strong>Purpose:</strong> Evaluates if a plan’s benefits are concentrated among key employees.</p>
            <p><strong>What It Does:</strong> Determines if key employees hold more than 60% of plan assets; if so, employer must contribute to NHCEs.</p>
            <p><strong>Why It Matters:</strong> Protects non-key employees.</p>
          </li>
          <li>
            <h2 className="font-semibold">Average Benefit Test</h2>
            <p><strong>Purpose:</strong> Alternative to the Ratio Percentage test to prove nondiscrimination.</p>
            <p><strong>What It Does:</strong> Compares average benefits of NHCEs vs HCEs across contributions and benefits.</p>
            <p><strong>Why It Matters:</strong> Allows flexibility in proving compliance.</p>
          </li>
        </ol>
      </section>

      <section>
        <h1 className="text-2xl font-bold">Cafeteria Plan Testing</h1>
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <h2 className="font-semibold">Key Employee Test</h2>
            <p><strong>Purpose:</strong> Prevents too much value from being concentrated among key employees.</p>
            <p><strong>What It Does:</strong> Assesses plan value distribution to owners and officers.</p>
            <p><strong>Why It Matters:</strong> Ensures equitable benefit distribution.</p>
          </li>
          <li>
            <h2 className="font-semibold">Eligibility Test</h2>
            <p><strong>Purpose:</strong> Ensures fair and nondiscriminatory eligibility rules.</p>
            <p><strong>What It Does:</strong> Reviews age and service criteria for NHCEs vs HCEs.</p>
            <p><strong>Why It Matters:</strong> Prevents unfair exclusion of lower-paid workers.</p>
          </li>
          <li>
            <h2 className="font-semibold">Classification Test</h2>
            <p><strong>Purpose:</strong> Verifies fairness in employee classification under Average Benefits Test.</p>
            <p><strong>What It Does:</strong> Reviews structure to avoid favoritism to executives or departments.</p>
            <p><strong>Why It Matters:</strong> Prevents targeted advantages.</p>
          </li>
          <li>
            <h2 className="font-semibold">Benefit Test</h2>
            <p><strong>Purpose:</strong> Measures if benefits favor HCEs too heavily.</p>
            <p><strong>What It Does:</strong> Compares benefit allocations and accruals between groups.</p>
            <p><strong>Why It Matters:</strong> Ensures fairness in benefit level distribution.</p>
          </li>
          <li>
            <h2 className="font-semibold">SIMPLE Cafeteria Plan Eligibility Test</h2>
            <p><strong>Purpose:</strong> Verifies broad participation eligibility.</p>
            <p><strong>What It Does:</strong> Ensures employees meeting age and service rules are included unless excluded by rule.</p>
            <p><strong>Why It Matters:</strong> Maintains SIMPLE plan integrity.</p>
          </li>
          <li>
            <h2 className="font-semibold">Cafeteria Contributions & Benefits Test</h2>
            <p><strong>Purpose:</strong> Prevents discriminatory allocation of cafeteria benefits.</p>
            <p><strong>What It Does:</strong> Analyzes benefits like FSAs and health premiums for fairness.</p>
            <p><strong>Why It Matters:</strong> Ensures tax-advantaged benefits aren't misused.</p>
          </li>
        </ol>
      </section>

      <section>
        <h1 className="text-2xl font-bold">DCAP Testing</h1>
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <h2 className="font-semibold">DCAP Eligibility Test</h2>
            <p><strong>Purpose:</strong> Confirms equal access to dependent care benefits.</p>
            <p><strong>What It Does:</strong> Evaluates plan criteria for age/service and NHCE vs HCE coverage.</p>
            <p><strong>Why It Matters:</strong> Promotes fairness in benefit access.</p>
          </li>
          <li>
            <h2 className="font-semibold">DCAP Owners Test</h2>
            <p><strong>Purpose:</strong> Verifies ineligible owners are excluded.</p>
            <p><strong>What It Does:</strong> Ensures IRS-defined non-employees (e.g., partners, S-corp owners) are not included.</p>
            <p><strong>Why It Matters:</strong> Maintains tax compliance.</p>
          </li>
          <li>
            <h2 className="font-semibold">DCAP 55% Benefits Test</h2>
            <p><strong>Purpose:</strong> Ensures majority of benefits go to non-key employees.</p>
            <p><strong>What It Does:</strong> Verifies non-key employees receive at least 55% of benefits.</p>
            <p><strong>Why It Matters:</strong> Prevents top-heavy DCAP usage.</p>
          </li>
          <li>
            <h2 className="font-semibold">DCAP Contributions Test</h2>
            <p><strong>Purpose:</strong> Ensures contributions stay within IRS limits and nondiscrimination rules.</p>
            <p><strong>What It Does:</strong> Evaluates salary reductions for compliance.</p>
            <p><strong>Why It Matters:</strong> Avoids penalties and plan disqualification.</p>
          </li>
          <li>
            <h2 className="font-semibold">DCAP Key Employee Concentration Test</h2>
            <p><strong>Purpose:</strong> Prevents over-concentration among key employees.</p>
            <p><strong>What It Does:</strong> Checks that key employees don't exceed 25% of total DCAP benefits.</p>
            <p><strong>Why It Matters:</strong> Maintains fair benefit distribution.</p>
          </li>
        </ol>
      </section>

      <section>
        <h1 className="text-2xl font-bold">FSA Testing</h1>
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <h2 className="font-semibold">Health FSA Eligibility Test</h2>
            <p><strong>Purpose:</strong> Ensures broad and fair access to FSA benefits.</p>
            <p><strong>What It Does:</strong> Reviews eligibility requirements to avoid exclusion of NHCEs.</p>
            <p><strong>Why It Matters:</strong> Promotes equal access to pre-tax healthcare spending.</p>
          </li>
          <li>
            <h2 className="font-semibold">Health FSA Benefits Test</h2>
            <p><strong>Purpose:</strong> Evaluates benefit amounts received by HCEs vs NHCEs.</p>
            <p><strong>What It Does:</strong> Assesses fairness in benefit allocation.</p>
            <p><strong>Why It Matters:</strong> Maintains tax-favored status by avoiding discrimination.</p>
          </li>
          <li>
            <h2 className="font-semibold">Health FSA Key Employee Concentration Test</h2>
            <p><strong>Purpose:</strong> Prevents more than 25% of benefits from going to key employees.</p>
            <p><strong>What It Does:</strong> Measures total benefits used by key employees.</p>
            <p><strong>Why It Matters:</strong> Prevents misuse by leadership.</p>
          </li>
          <li>
            <h2 className="font-semibold">Health FSA 55% Average Benefits Test</h2>
            <p><strong>Purpose:</strong> Confirms non-key employees receive most benefits.</p>
            <p><strong>What It Does:</strong> Checks that non-key employees receive 55%+ of benefits.</p>
            <p><strong>Why It Matters:</strong> Preserves fair benefit allocation.</p>
          </li>
        </ol>
      </section>

      <section>
        <h1 className="text-2xl font-bold">HRA Testing</h1>
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <h2 className="font-semibold">HRA Eligibility Test</h2>
            <p><strong>Purpose:</strong> Ensures fair eligibility standards for HRA participation.</p>
            <p><strong>What It Does:</strong> Reviews criteria like service time and classifications.</p>
            <p><strong>Why It Matters:</strong> Ensures equal access to employer-paid health benefits.</p>
          </li>
          <li>
            <h2 className="font-semibold">HRA Benefits Test</h2>
            <p><strong>Purpose:</strong> Measures benefit equity between HCEs and NHCEs.</p>
            <p><strong>What It Does:</strong> Compares dollar value of reimbursements.</p>
            <p><strong>Why It Matters:</strong> Avoids tax disqualification from discrimination.</p>
          </li>
          <li>
            <h2 className="font-semibold">HRA 55% Average Benefits Test</h2>
            <p><strong>Purpose:</strong> Confirms majority of benefits go to non-key employees.</p>
            <p><strong>What It Does:</strong> Calculates 55% threshold for non-key usage.</p>
            <p><strong>Why It Matters:</strong> Preserves tax-advantaged status.</p>
          </li>
          <li>
            <h2 className="font-semibold">HRA Key Employee Concentration Test</h2>
            <p><strong>Purpose:</strong> Checks for over-concentration of HRA reimbursements to key employees.</p>
            <p><strong>What It Does:</strong> Ensures no more than 25% of benefits go to key employees.</p>
            <p><strong>Why It Matters:</strong> Maintains fairness in benefit use.</p>
          </li>
          <li>
            <h2 className="font-semibold">HRA 25% Owner Rule Test</h2>
            <p><strong>Purpose:</strong> Confirms disqualified owners are excluded.</p>
            <p><strong>What It Does:</strong> Excludes S-corp shareholders, partners, etc. who own 25%+.</p>
            <p><strong>Why It Matters:</strong> Avoids IRS penalties and ensures plan compliance.</p>
          </li>
        </ol>
      </section>

      <section>
        <h1 className="text-2xl font-bold">401(k) Retirement Plan Testing</h1>
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <h2 className="font-semibold">ADP Safe Harbor Test</h2>
            <p><strong>Purpose:</strong> Exempts the plan from ADP testing if Safe Harbor rules are met.</p>
            <p><strong>What It Does:</strong> Verifies employer contributions and notice requirements.</p>
            <p><strong>Why It Matters:</strong> Allows HCEs to contribute up to the IRS limit without risk.</p>
          </li>
          <li>
            <h2 className="font-semibold">ADP Safe Harbor (Sliding Scale) Test</h2>
            <p><strong>Purpose:</strong> Uses a flexible matching formula to meet Safe Harbor requirements.</p>
            <p><strong>What It Does:</strong> Evaluates tiered matches and compliance criteria.</p>
            <p><strong>Why It Matters:</strong> Offers contribution flexibility while avoiding ADP testing.</p>
          </li>
          <li>
            <h2 className="font-semibold">Safe Harbor Test (401(k))</h2>
            <p><strong>Purpose:</strong> Confirms the plan meets Safe Harbor provisions broadly.</p>
            <p><strong>What It Does:</strong> Covers contributions, vesting, and annual employee notice.</p>
            <p><strong>Why It Matters:</strong> Simplifies plan admin and ensures automatic compliance.</p>
          </li>
          <li>
            <h2 className="font-semibold">Ratio Percentage Test</h2>
            <p><strong>Purpose:</strong> Verifies sufficient NHCE coverage compared to HCEs.</p>
            <p><strong>What It Does:</strong> Calculates and compares participation ratios.</p>
            <p><strong>Why It Matters:</strong> Ensures nondiscriminatory plan coverage.</p>
          </li>
        </ol>
      </section>
    </div>
  );
};

export default TestInfoPage;

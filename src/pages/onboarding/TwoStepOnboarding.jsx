// src/pages/FourStepOnboarding.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import Logo from '../../assets/logo.png'

import {
  Users,           // step 1: identities (you/company)
  Layers,          // step 2: categories you DO
  Handshake,       // step 3: identities you WANT
  Tags,            // step 4: categories you WANT
  Factory,         // step 5: industries
} from "lucide-react";

export const OnboardingIcons = {
  step1: (props) => <Users className="h-6 w-6" {...props} />,
  step2: (props) => <Layers className="h-6 w-6" {...props} />,
  step3: (props) => <Handshake className="h-6 w-6" {...props} />,
  step4: (props) => <Tags className="h-6 w-6" {...props} />,
  step5: (props) => <Factory className="h-6 w-6" {...props} />,
};

/**
 * FourStepOnboarding.jsx
 * - Step 1: Who you are (identities)            → what you DO
 * - Step 2: Where you belong (cats/subs/subsubs)→ what you DO
 * - Step 3: What you're looking for (identities)→ what you WANT (MAX 3)
 * - Step 4: Categories you're looking for       → what you WANT (MAX 3 CATEGORIES)
 *
 * Notes:
 * - Only categories are mandatory in Steps 2 and 4 (sub/subsub optional).
 * - Sub-sub shows if its parent subcategory is OPEN (chevron) OR SELECTED.
 * - Fully controlled collapsibles (no <details>/<summary>) to avoid click issues.
 * - Step 3 limit: up to 3 identities.
 * - Step 4 limit: up to 3 categories (you may pick many sub/subsubs under those categories).
 * - Posts both tracks to /onboarding/oneshot.
 */
export default function FourStepOnboarding() {
  const nav = useNavigate();
  const userAuth = useAuth();

  // limits for "WANT" track
  const MAX_WANT_IDENTITIES = 3;
  const MAX_WANT_CATEGORIES = 3;

  // flow
  const [step, setStep] = useState(1);
  const progress = useMemo(() => [0, 16.67, 33.33, 50, 66.67, 83.33, 100][step] ?? 100, [step]);

  // ⬇️ NEW: always scroll to top when the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [identities, setIdentities] = useState([]);
  const [userAccountType, setUserAccountType] = useState(null);

  // selections (what user DOES)
  const [identityIds, setIdentityIds] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [subsubCategoryIds, setSubsubCategoryIds] = useState([]);

  // selections (what user WANTS)
  const [interestIdentityIds, setInterestIdentityIds] = useState([]);
  const [interestCategoryIds, setInterestCategoryIds] = useState([]);
  const [interestSubcategoryIds, setInterestSubcategoryIds] = useState([]);
  const [interestSubsubCategoryIds, setInterestSubsubCategoryIds] = useState([]);

  // industry selections
  const [industries, setIndustries] = useState([]);
  const [industryCategoryIds, setIndustryCategoryIds] = useState([]);
  const [industrySubcategoryIds, setIndustrySubcategoryIds] = useState([]);
  const [industrySubsubCategoryIds, setIndustrySubsubCategoryIds] = useState([]);

  // UI expand/collapse – separate sets for "does" and "wants"
  const [openCatsDoes, setOpenCatsDoes] = useState(() => new Set()); // Set<categoryId>
  const [openSubsDoes, setOpenSubsDoes] = useState(() => new Set()); // Set<subcategoryId>
  const [openCatsWant, setOpenCatsWant] = useState(() => new Set());
  const [openSubsWant, setOpenSubsWant] = useState(() => new Set());

  // UI expand/collapse for industries
  const [openIndustryCats, setOpenIndustryCats] = useState(() => new Set()); // Set<industryCategoryId>
  const [openIndustrySubs, setOpenIndustrySubs] = useState(() => new Set()); // Set<industrySubcategoryId>

  // load catalog
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        // First get user info to determine account type
        const userResponse = await client.get("/auth/me");
        const userAccountType = userResponse.data?.accountType;
        setUserAccountType(userAccountType);

        // gets identities + canonical IDs for categories/subcats/subsubs + goals WITH ids
        const { data } = await client.get("/public/identities?type=all");
        setIdentities(Array.isArray(data?.identities) ? data.identities : []);

        // Load industry categories
        const industryResponse = await client.get("/industry-categories/tree");
        setIndustries(
          Array.isArray(industryResponse.data?.industryCategories)
            ? industryResponse.data.industryCategories
            : []
        );
      } catch (e) {
        console.error(e);
        setError("Failed to load onboarding data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // auth guard
  useEffect(() => {
    if (!userAuth.user && !userAuth?.loading) {
      nav("/login");
    }
  }, [userAuth.user, userAuth?.loading, nav]);

  const getIdentityKey = (iden) => iden.id || `name:${iden.name}`;

  // Get the appropriate identities based on account type
  const identitiesToShow = useMemo(() => {
    if (userAccountType === "company") {
      return Array.isArray(identities) ? identities : [];
    }
    return Array.isArray(identities) ? identities : [];
  }, [identities, userAccountType]);

  // maps/relationships (shared)
  const catToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identitiesToShow) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        m[c.id] = m[c.id] || new Set();
        m[c.id].add(ik);
      }
    }
    return m;
  }, [identitiesToShow]);

  const subToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identitiesToShow) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          m[s.id] = m[s.id] || new Set();
          m[s.id].add(ik);
        }
      }
    }
    return m;
  }, [identitiesToShow]);

  const subsubToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identitiesToShow) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (!x?.id) continue;
            m[x.id] = m[x.id] || new Set();
            m[x.id].add(ik);
          }
        }
      }
    }
    return m;
  }, [identitiesToShow]);

  const subToCat = useMemo(() => {
    const m = {};
    for (const iden of identitiesToShow) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (s?.id) m[s.id] = c.id;
        }
      }
    }
    return m;
  }, [identitiesToShow]);

  const subsubToSub = useMemo(() => {
    const m = {};
    for (const iden of identitiesToShow) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (x?.id) m[x.id] = s.id;
          }
        }
      }
    }
    return m;
  }, [identitiesToShow]);

  const catToAllSubIds = useMemo(() => {
    const m = {};
    for (const iden of identitiesToShow) {
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        const subs = (c.subcategories || []).map((s) => s.id).filter(Boolean);
        m[c.id] = Array.from(new Set([...(m[c.id] || []), ...subs]));
      }
    }
    return m;
  }, [identitiesToShow]);

  const subToAllSubsubIds = useMemo(() => {
    const m = {};
    for (const iden of identitiesToShow) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          const subsubs = (s.subsubs || []).map((x) => x.id).filter(Boolean);
          m[s.id] = Array.from(new Set([...(m[s.id] || []), ...subsubs]));
        }
      }
    }
    return m;
  }, [identitiesToShow]);

  // ---------- Toggles (generic builders) ----------

  function makeToggleIdentity({
    pickIds,
    setPickIds,
    setCats,
    setSubs,
    setSubsubs,
    setOpenCats,
    setOpenSubs,
  }) {
    return (identityKey) => {
      setPickIds((prev) => {
        const picked = prev.includes(identityKey)
          ? prev.filter((x) => x !== identityKey)
          : [...prev, identityKey];

        const stillCovered = (ownersMap, id) => {
          const owners = ownersMap[id];
          if (!owners) return false;
          return picked.some((ik) => owners.has(ik));
        };

        setSubsubs((prevX) => prevX.filter((xid) => stillCovered(subsubToIdentityKeys, xid)));
        setSubs((prevSubs) => prevSubs.filter((sid) => stillCovered(subToIdentityKeys, sid)));
        setCats((prevCats) => prevCats.filter((cid) => stillCovered(catToIdentityKeys, cid)));

        setOpenCats((prevOpen) => {
          const next = new Set([...prevOpen]);
          for (const cid of [...prevOpen]) {
            const owners = catToIdentityKeys[cid];
            if (!owners || !picked.some((ik) => owners.has(ik))) next.delete(cid);
          }
          return next;
        });

        setOpenSubs((prevOpen) => {
          const next = new Set([...prevOpen]);
          for (const sid of [...prevOpen]) {
            const owners = subToIdentityKeys[sid];
            if (!owners || !picked.some((ik) => owners.has(ik))) next.delete(sid);
          }
          return next;
        });

        return picked;
      });
    };
  }

  function makeToggleCategory({
    catIds,
    setCatIds,
    setSubIds,
    setXIds,
    setOpenCats,
    setOpenSubs,
  }) {
    return (catId) => {
      if (!catId) return;
      const has = catIds.includes(catId);
      if (has) {
        const subIds = catToAllSubIds[catId] || [];
        const xIds = subIds.flatMap((sid) => subToAllSubsubIds[sid] || []);
        setCatIds((prev) => prev.filter((x) => x !== catId));
        setSubIds((prev) => prev.filter((sid) => !subIds.includes(sid)));
        setXIds((prev) => prev.filter((x) => !xIds.includes(x)));
        setOpenCats((prev) => {
          const next = new Set(prev);
          next.delete(catId);
          return next;
        });
        setOpenSubs((prev) => {
          const next = new Set(prev);
          for (const sid of subIds) next.delete(sid);
          return next;
        });
      } else {
        setCatIds((prev) => [...prev, catId]);
        setOpenCats((prev) => new Set(prev).add(catId));
      }
    };
  }

  function makeToggleSub({
    subIds,
    setSubIds,
    setXIds,
    setOpenSubs,
    setCatIds,
    setOpenCats,
  }) {
    return (subId) => {
      if (!subId) return;
      const parentCatId = subToCat[subId];
      const has = subIds.includes(subId);
      if (has) {
        const xIds = subToAllSubsubIds[subId] || [];
        setSubIds((prev) => prev.filter((x) => x !== subId));
        setXIds((prev) => prev.filter((x) => !xIds.includes(x)));
        setOpenSubs((prev) => {
          const n = new Set(prev);
          n.delete(subId);
          return n;
        });
      } else {
        if (parentCatId) {
          setCatIds((prev) => (prev.includes(parentCatId) ? prev : [...prev, parentCatId]));
          setOpenCats((prev) => new Set(prev).add(parentCatId));
        }
        setSubIds((prev) => [...prev, subId]);
      }
    };
  }

  function makeToggleSubsub({ setXIds, subIds, setSubIds, setCatIds, setOpenCats }) {
    return (xId) => {
      if (!xId) return;
      const parentSubId = subsubToSub[xId];
      const parentCatId = parentSubId ? subToCat[parentSubId] : null;
      setXIds((prev) => {
        const has = prev.includes(xId);
        if (has) return prev.filter((x) => x !== xId);
        if (parentSubId && !subIds.includes(parentSubId)) {
          setSubIds((p) => [...p, parentSubId]);
        }
        if (parentCatId) {
          setCatIds((p) => (p.includes(parentCatId) ? p : [...p, parentCatId]));
          setOpenCats((p) => new Set(p).add(parentCatId));
        }
        return [...prev, xId];
      });
    };
  }

  // ---------- LIMITED versions for the WANT track ----------

  const toggleIdentityWantBase = makeToggleIdentity({
    pickIds: interestIdentityIds,
    setPickIds: setInterestIdentityIds,
    setCats: setInterestCategoryIds,
    setSubs: setInterestSubcategoryIds,
    setSubsubs: setInterestSubsubCategoryIds,
    setOpenCats: setOpenCatsWant,
    setOpenSubs: setOpenSubsWant,
  });

  const toggleIdentityWant = (identityKey) => {
    const already = interestIdentityIds.includes(identityKey);
    if (!already && interestIdentityIds.length >= MAX_WANT_IDENTITIES) return;
    toggleIdentityWantBase(identityKey);
  };

  const toggleCategoryWantBase = makeToggleCategory({
    catIds: interestCategoryIds,
    setCatIds: setInterestCategoryIds,
    setSubIds: setInterestSubcategoryIds,
    setXIds: setInterestSubsubCategoryIds,
    setOpenCats: setOpenCatsWant,
    setOpenSubs: setOpenSubsWant,
  });

  const toggleCategoryWant = (catId) => {
    const already = interestCategoryIds.includes(catId);
    if (!already && interestCategoryIds.length >= MAX_WANT_CATEGORIES) return;
    toggleCategoryWantBase(catId);
  };

  const toggleSubWantBase = makeToggleSub({
    subIds: interestSubcategoryIds,
    setSubIds: setInterestSubcategoryIds,
    setXIds: setInterestSubsubCategoryIds,
    setOpenSubs: setOpenSubsWant,
    setCatIds: setInterestCategoryIds,
    setOpenCats: setOpenCatsWant,
  });

  const toggleSubWant = (subId) => {
    const parentCatId = subToCat[subId];
    const parentSelected = parentCatId ? interestCategoryIds.includes(parentCatId) : true;
    // If selecting and parent category is not selected, ensure we don't exceed category limit
    const selecting = !interestSubcategoryIds.includes(subId);
    if (selecting && !parentSelected && interestCategoryIds.length >= MAX_WANT_CATEGORIES) return;
    toggleSubWantBase(subId);
  };

  const toggleSubsubWantBase = makeToggleSubsub({
    setXIds: setInterestSubsubCategoryIds,
    subIds: interestSubcategoryIds,
    setSubIds: setInterestSubcategoryIds,
    setCatIds: setInterestCategoryIds,
    setOpenCats: setOpenCatsWant,
  });

  const toggleSubsubWant = (xId) => {
    const parentSubId = subsubToSub[xId];
    const parentCatId = parentSubId ? subToCat[parentSubId] : null;
    const parentCatSelected = parentCatId ? interestCategoryIds.includes(parentCatId) : true;
    const selecting = !interestSubsubCategoryIds.includes(xId);
    if (selecting && !parentCatSelected && interestCategoryIds.length >= MAX_WANT_CATEGORIES) return;
    toggleSubsubWantBase(xId);
  };

  // ---------- Industry toggle functions ----------

  function makeToggleIndustryCategory({
    industryCatIds,
    setIndustryCatIds,
    setIndustrySubIds,
    setIndustryXIds,
    setOpenIndustryCats,
    setOpenIndustrySubs,
  }) {
    return (industryCatId) => {
      if (!industryCatId) return;
      const has = industryCatIds.includes(industryCatId);
      if (has) {
        const subIds =
          industries.find((cat) => cat.id === industryCatId)?.subcategories?.map((s) => s.id) ||
          [];
        const xIds = subIds.flatMap(
          (sid) =>
            industries
              .find((cat) => cat.id === industryCatId)
              ?.subcategories?.find((s) => s.id === sid)?.subsubs?.map((x) => x.id) || []
        );
        setIndustryCatIds((prev) => prev.filter((x) => x !== industryCatId));
        setIndustrySubIds((prev) => prev.filter((sid) => !subIds.includes(sid)));
        setIndustryXIds((prev) => prev.filter((x) => !xIds.includes(x)));
        setOpenIndustryCats((prev) => {
          const next = new Set(prev);
          next.delete(industryCatId);
          return next;
        });
        setOpenIndustrySubs((prev) => {
          const next = new Set(prev);
          for (const sid of subIds) next.delete(sid);
          return next;
        });
      } else {
        setIndustryCatIds((prev) => [...prev, industryCatId]);
        setOpenIndustryCats((prev) => new Set(prev).add(industryCatId));
      }
    };
  }

  function makeToggleIndustrySub({
    industrySubIds,
    setIndustrySubIds,
    setIndustryXIds,
    setOpenIndustrySubs,
    setIndustryCatIds,
    setOpenIndustryCats,
  }) {
    return (industrySubId) => {
      if (!industrySubId) return;
      const parentCatId = industries.find((cat) =>
        cat.subcategories?.some((s) => s.id === industrySubId)
      )?.id;
      const has = industrySubIds.includes(industrySubId);
      if (has) {
        const xIds =
          industries
            .find((cat) => cat.id === parentCatId)
            ?.subcategories?.find((s) => s.id === industrySubId)
            ?.subsubs?.map((x) => x.id) || [];
        setIndustrySubIds((prev) => prev.filter((x) => x !== industrySubId));
        setIndustryXIds((prev) => prev.filter((x) => !xIds.includes(x)));
        setOpenIndustrySubs((prev) => {
          const n = new Set(prev);
          n.delete(industrySubId);
          return n;
        });
      } else {
        if (parentCatId) {
          setIndustryCatIds((prev) => (prev.includes(parentCatId) ? prev : [...prev, parentCatId]));
          setOpenIndustryCats((prev) => new Set(prev).add(parentCatId));
        }
        setIndustrySubIds((prev) => [...prev, industrySubId]);
      }
    };
  }

  function makeToggleIndustrySubsub({
    setIndustryXIds,
    industrySubIds,
    setIndustrySubIds,
    setIndustryCatIds,
    setOpenIndustryCats,
  }) {
    return (industryXId) => {
      if (!industryXId) return;
      const parentSubId = industries
        .flatMap((cat) => cat.subcategories || [])
        .find((s) => s.subsubs?.some((x) => x.id === industryXId))?.id;
      const parentCatId = parentSubId
        ? industries.find((cat) => cat.subcategories?.some((s) => s.id === parentSubId))?.id
        : null;
      setIndustryXIds((prev) => {
        const has = prev.includes(industryXId);
        if (has) return prev.filter((x) => x !== industryXId);
        if (parentSubId && !industrySubIds.includes(parentSubId)) {
          setIndustrySubIds((p) => [...p, parentSubId]);
        }
        if (parentCatId) {
          setIndustryCatIds((p) => (p.includes(parentCatId) ? p : [...p, parentCatId]));
          setOpenIndustryCats((p) => new Set(p).add(parentCatId));
        }
        return [...prev, industryXId];
      });
    };
  }

  const toggleIndustryCategory = makeToggleIndustryCategory({
    industryCatIds: industryCategoryIds,
    setIndustryCatIds: setIndustryCategoryIds,
    setIndustrySubIds: setIndustrySubcategoryIds,
    setIndustryXIds: setIndustrySubsubCategoryIds,
    setOpenIndustryCats: setOpenIndustryCats,
    setOpenIndustrySubs: setOpenIndustrySubs,
  });

  const toggleIndustrySub = makeToggleIndustrySub({
    industrySubIds: industrySubcategoryIds,
    setIndustrySubIds: setIndustrySubcategoryIds,
    setIndustryXIds: setIndustrySubsubCategoryIds,
    setOpenIndustrySubs: setOpenIndustrySubs,
    setIndustryCatIds: setIndustryCategoryIds,
    setOpenIndustryCats: setOpenIndustryCats,
  });

  const toggleIndustrySubsub = makeToggleIndustrySubsub({
    setIndustryXIds: setIndustrySubsubCategoryIds,
    industrySubIds: industrySubcategoryIds,
    setIndustrySubIds: setIndustrySubcategoryIds,
    setIndustryCatIds: setIndustryCategoryIds,
    setOpenIndustryCats: setOpenIndustryCats,
  });

  // Subcategory open/close (panel only)
  const toggleSubOpenDoes = (subId) => {
    if (!subId) return;
    setOpenSubsDoes((prev) => {
      const n = new Set(prev);
      n.has(subId) ? n.delete(subId) : n.add(subId);
      return n;
    });
  };
  const toggleSubOpenWant = (subId) => {
    if (!subId) return;
    setOpenSubsWant((prev) => {
      const n = new Set(prev);
      n.has(subId) ? n.delete(subId) : n.add(subId);
      return n;
    });
  };

  // Category panel open/close
  const handleCatOpenDoes = (catId) => {
    setOpenCatsDoes((prev) => {
      const n = new Set(prev);
      n.has(catId) ? n.delete(catId) : n.add(catId);
      return n;
    });
  };
  const handleCatOpenWant = (catId) => {
    setOpenCatsWant((prev) => {
      const n = new Set(prev);
      n.has(catId) ? n.delete(catId) : n.add(catId);
      return n;
    });
  };

  // Industry panel open/close
  const handleIndustryCatOpen = (industryCatId) => {
    setOpenIndustryCats((prev) => {
      const n = new Set(prev);
      n.has(industryCatId) ? n.delete(industryCatId) : n.add(industryCatId);
      return n;
    });
  };

  const toggleIndustrySubOpen = (industrySubId) => {
    if (!industrySubId) return;
    setOpenIndustrySubs((prev) => {
      const n = new Set(prev);
      n.has(industrySubId) ? n.delete(industrySubId) : n.add(industrySubId);
      return n;
    });
  };

  // build per-track handlers (DOES) - modified to allow only one selection for step 1
  const toggleIdentityDoes = (identityKey) => {
    setIdentityIds(prev => {
      const currentlySelected = prev.includes(identityKey);
      if (currentlySelected) {
        // If clicking the already selected item, deselect it
        return [];
      } else {
        // If clicking a new item, select only this one (replace any existing selection)
        return [identityKey];
      }
    });

    // Also handle category/subcategory cleanup when selection changes
    setSubsubCategoryIds(prev => {
      const stillCovered = (ownersMap, id) => {
        const owners = ownersMap[id];
        if (!owners) return false;
        return [identityKey].some((ik) => owners.has(ik));
      };
      return prev.filter((xid) => stillCovered(subsubToIdentityKeys, xid));
    });

    setSubcategoryIds(prev => {
      const stillCovered = (ownersMap, id) => {
        const owners = ownersMap[id];
        if (!owners) return false;
        return [identityKey].some((ik) => owners.has(ik));
      };
      return prev.filter((sid) => stillCovered(subToIdentityKeys, sid));
    });

    setCategoryIds(prev => {
      const stillCovered = (ownersMap, id) => {
        const owners = ownersMap[id];
        if (!owners) return false;
        return [identityKey].some((ik) => owners.has(ik));
      };
      return prev.filter((cid) => stillCovered(catToIdentityKeys, cid));
    });

    setOpenCatsDoes(prev => {
      const next = new Set([...prev]);
      for (const cid of [...prev]) {
        const owners = catToIdentityKeys[cid];
        if (!owners || ![identityKey].some((ik) => owners.has(ik))) next.delete(cid);
      }
      return next;
    });

    setOpenSubsDoes(prev => {
      const next = new Set([...prev]);
      for (const sid of [...prev]) {
        const owners = subToIdentityKeys[sid];
        if (!owners || ![identityKey].some((ik) => owners.has(ik))) next.delete(sid);
      }
      return next;
    });
  };
  const toggleCategoryDoes = makeToggleCategory({
    catIds: categoryIds,
    setCatIds: setCategoryIds,
    setSubIds: setSubcategoryIds,
    setXIds: setSubsubCategoryIds,
    setOpenCats: setOpenCatsDoes,
    setOpenSubs: setOpenSubsDoes,
  });
  const toggleSubDoes = makeToggleSub({
    subIds: subcategoryIds,
    setSubIds: setSubcategoryIds,
    setXIds: setSubsubCategoryIds,
    setOpenSubs: setOpenSubsDoes,
    setCatIds: setCategoryIds,
    setOpenCats: setOpenCatsDoes,
  });
  const toggleSubsubDoes = makeToggleSubsub({
    setXIds: setSubsubCategoryIds,
    subIds: subcategoryIds,
    setSubIds: setSubcategoryIds,
    setCatIds: setCategoryIds,
    setOpenCats: setOpenCatsDoes,
  });

  // derived lists
  const selectedIdentitiesDoes = useMemo(() => {
    const keys = new Set(identityIds);
    return identitiesToShow.filter((iden) => keys.has(getIdentityKey(iden)));
  }, [identitiesToShow, identityIds]);

  const selectedIdentitiesWant = useMemo(() => {
    const keys = new Set(interestIdentityIds);
    return identitiesToShow.filter((iden) => keys.has(getIdentityKey(iden)));
  }, [identitiesToShow, interestIdentityIds]);

  // guards
  const canContinue1 = identityIds.length >= 1;
  const canContinue2 = categoryIds.length >= 1;
  const canContinue3 = interestIdentityIds.length >= 1 && interestIdentityIds.length <= MAX_WANT_IDENTITIES;
  const canContinue4 =
    interestCategoryIds.length >= 1 && interestCategoryIds.length <= MAX_WANT_CATEGORIES;
  const canFinish = industryCategoryIds.length >= 1;

  // UI bits
  const Loading = () => (
    <div className="min-h-screen grid place-items-center text-brand-700">
      <div className="flex items-center gap-2">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
          />
        </svg>
        <span>Loading…</span>
      </div>
    </div>
  );

  const Header = ({ icon, title, subtitle, extra }) => (
    <header className="max-w-3xl mx-auto text-center">
     {/**  <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
        
        {icon}
       
      </div>**/}
       <div className="flex justify-center mb-7 mt-4">
        <img className="w-[100px]" src={Logo}/>
       </div>
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="text-gray-500">{subtitle}</p>
      {extra}
      <div className="mt-4 h-2 bg-gray-200 rounded">
        <div className="h-2 rounded bg-brand-700" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );

  if (loading || !userAuth.user) return <Loading />;
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-red-600 font-semibold mb-2">Error</div>
          <div className="text-sm text-gray-700">{error}</div>
        </div>
      </div>
    );
  }

  // ------- Reusable step blocks -------

  function IdentityStep({ title, subtitle, picked, onToggle, next, canNext, prev, limit }) {
    const reached = typeof limit === "number" && picked.length >= limit;

    return (
      <>
        <Header
          icon={<OnboardingIcons.step1 />}
          title={title}
          subtitle={subtitle}
          extra={
            typeof limit === "number" ? (
              <div className="mt-2 text-sm text-gray-500">Selected {picked.length}/{limit}</div>
            ) : null
          }
        />
        <main className="max-w-3xl mx-auto mt-6">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-gray-500 mb-5 text-[18px]">
              {typeof limit === "number" && limit === 1
                ? "Choose one."
                : `Choose one or more${typeof limit === "number" ? ` (up to ${limit}).` : "."}`}
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {identitiesToShow.filter(i=>i.type==userAccountType || step!=1).map((iden, i) => {
                const key = getIdentityKey(iden);
                const active = picked.includes(key);
                const disabled = !active && reached; // can't add more
                return (
                  <button
                    key={`${i}-${iden.name}`}
                    onClick={() => !disabled && onToggle(key)}
                    disabled={disabled}
                    className={`rounded-xl flex items-center justify-between border px-4 py-3 text-left hover:shadow-soft ${
                      active ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>
                      <div className="font-medium">{iden.name}</div>
                      <div className="text-xs text-gray-500">
                        {(iden.categories || []).length} categories
                      </div>
                    </div>
                    <input type="checkbox" className="h-4 w-4 pointer-events-none" checked={active} readOnly />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            {prev ? (
              <button onClick={prev} className="rounded-xl border px-4 py-3">
                Previous
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={next}
              disabled={!canNext}
              className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </main>
      </>
    );
  }

  // Industry tree step component
  function IndustryTreeStep({
    title,
    subtitle,
    industryCatIds,
    industrySubIds,
    industryXIds,
    openIndustryCats,
    openIndustrySubs,
    onToggleIndustryCat,
    onToggleIndustrySub,
    onToggleIndustrySubsub,
    onToggleIndustryCatOpen,
    toggleIndustrySubOpen,
    prev,
    nextLabel,
    onNext,
    canNext,
  }) {
    const hasIndustrySubs = (industryCat) =>
      Array.isArray(industryCat?.subcategories) && industryCat.subcategories.length > 0;
    const hasIndustrySubsubs = (industrySc) =>
      Array.isArray(industrySc?.subsubs) && industrySc.subsubs.length > 0;

    return (
      <>
        <Header icon={<OnboardingIcons.step4 />} title={title} subtitle={subtitle} />
        <main className="max-w-4xl mx-auto mt-6">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            {industries.length === 0 ? (
              <div className="rounded-xl border bg-white p-6 text-[17px] text-gray-600">
                Loading industry categories...
              </div>
            ) : (
              <>
                <p className="text-[17px] text-gray-500 mb-4">
                  Choose at least one industry category that represents your professional focus.
                </p>

                <div className="space-y-4">
                  {industries.map((industryCat, cIdx) => {
                    const _hasSubs = hasIndustrySubs(industryCat);
                    const industryCatOpen = !!industryCat.id && openIndustryCats.has(industryCat.id);
                    const industryCatSelected =
                      !!industryCat.id && industryCategoryIds.includes(industryCat.id);

                    return (
                      <div key={`industry-cat-${cIdx}`} className="rounded-xl border">
                        {/* Header shows the main category name */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                          <div  onClick={() =>
                                industryCat.id && onToggleIndustryCat(industryCat.id)
                              } className="flex items-center gap-2 cursor-pointer">
                             <input
                              aria-label={`Select ${industryCat.name}`}
                              type="checkbox"
                              className="h-4 w-4"
                              checked={industryCatSelected}
                             
                          />
                          <div className="font-semibold">{industryCat.name}</div>
                          </div>

                          <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {(industryCat.subcategories || []).length} subcategories
                          </span>

                           <div className="flex items-center gap-3">
                            {/* Checkbox selects the main category; we DON'T repeat the name here */}
                           
                            {_hasSubs && (
                              <button
                                type="button"
                                className="text-gray-500 hover:text-gray-700 ml-auto"
                                aria-expanded={industryCatOpen}
                                onClick={() =>
                                  industryCat.id && onToggleIndustryCatOpen(industryCat.id)
                                }
                              >
                                <span
                                  className={`inline-block transition-transform ${
                                    industryCatOpen ? "rotate-180" : ""
                                  }`}
                                >
                                  ▾
                                </span>
                              </button>
                            )}
                            
                          </div>
                          </div>

                          
                        </div>

                        <div className={`${_hasSubs && industryCatOpen ? ' px-4 py-4 space-y-3':''}`}>
                         

                          {_hasSubs && industryCatOpen && (
                            <div className="ml-7 space-y-3">
                              {(industryCat.subcategories || []).map((industrySc, sIdx) => {
                                const _hasSubsubs = hasIndustrySubsubs(industrySc);
                                const isOpen =
                                  !!industrySc.id && openIndustrySubs.has(industrySc.id);
                                const isSelected =
                                  !!industrySc.id && industrySubIds.includes(industrySc.id);

                                return (
                                  <div
                                    key={`industry-sub-${cIdx}-${sIdx}`}
                                    className="border rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <label className="flex items-center w-full flex-1 gap-3 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 text-brand-600"
                                          checked={isSelected}
                                          onChange={() =>
                                            industrySc.id && onToggleIndustrySub(industrySc.id)
                                          }
                                        />
                                        <span className="font-medium w-full flex flex-1">
                                          {industrySc.name}
                                        </span>
                                      </label>

                                      {_hasSubsubs && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            industrySc.id && toggleIndustrySubOpen(industrySc.id)
                                          }
                                          className="text-gray-500 hover:text-gray-700"
                                          aria-expanded={isOpen}
                                          aria-label={`Toggle ${industrySc.name} sub-items`}
                                        >
                                          <span
                                            className={`inline-block transition-transform ${
                                              isOpen ? "rotate-180" : ""
                                            }`}
                                          >
                                            ▾
                                          </span>
                                        </button>
                                      )}
                                    </div>

                                    {_hasSubsubs && (isOpen || isSelected) && (
                                      <div className="mt-2 flex flex-wrap gap-2 ml-7">
                                        {industrySc.subsubs.map((industrySs, ssIdx) => {
                                          const ssSelected =
                                            !!industrySs.id &&
                                            industryXIds.includes(industrySs.id);
                                        return (
                                          <label
                                            key={`industry-ss-${cIdx}-${sIdx}-${ssIdx}`}
                                            className="inline-flex items-center gap-2 px-2 py-1 border rounded-full text-sm cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={ssSelected}
                                              onChange={() =>
                                                industrySs.id &&
                                                onToggleIndustrySubsub(industrySs.id)
                                              }
                                            />
                                            <span>{industrySs.name}</span>
                                          </label>
                                        );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={prev} className="rounded-xl border px-4 py-3">
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={!canNext}
              className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
            >
              {nextLabel}
            </button>
          </div>
        </main>
      </>
    );
  }

  // Fully controlled collapsible category tree (no <details>)
  function CategoryTreeStep({
    title,
    subtitle,
    selectedIdentities,
    catIds,
    subIds,
    xIds,
    openCats,
    openSubs,
    onToggleCat,
    onToggleSub,
    onToggleSubsub,
    onToggleCatOpen, // (catId) => void
    toggleSubOpen, // (subId) => void
    prev,
    nextLabel,
    onNext,
    canNext,
    catLimit, // optional (number)
  }) {
    const hasSubs = (cat) => Array.isArray(cat?.subcategories) && cat.subcategories.length > 0;
    const hasSubsubs = (sc) => Array.isArray(sc?.subsubs) && sc.subsubs.length > 0;
    const reachedCatLimit = typeof catLimit === "number" && catIds.length >= catLimit;

    return (
      <>
        <Header
          icon={<OnboardingIcons.step3 />}
          title={title}
          subtitle={subtitle}
          extra={
            typeof catLimit === "number" ? (
              <div className="mt-2 text-sm text-gray-500">
                Selected categories {catIds.length}/{catLimit}
              </div>
            ) : null
          }
        />
        <main className="max-w-4xl mx-auto mt-6">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            {selectedIdentities.length === 0 ? (
              <div className="rounded-xl border bg-white p-6 text-[17px] text-gray-600">
                Select at least one identity in the previous step to see categories here.
              </div>
            ) : (
              <>
                <p className="text-[17px] text-gray-500 mb-4">
                  Choose at least one category{typeof catLimit === "number" ? ` (up to ${catLimit}).` : "."}
                </p>

                <div className="space-y-4">
                  {selectedIdentities.map((iden, iIdx) => (
                    <div key={`iden-${iIdx}`} className="rounded-xl border">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                        <div className="font-semibold">{iden.name}</div>
                        <span className="text-xs text-gray-500">
                          {(iden.categories || []).length} categories
                        </span>
                      </div>

                      <div className="px-4 py-4 space-y-3">
                        {(iden.categories || []).map((cat, cIdx) => {
                          const _hasSubs = hasSubs(cat);
                          const catOpen = !!cat.id && openCats.has(cat.id);
                          const catSelected = !!cat.id && catIds.includes(cat.id);
                          const catDisabled = !!cat.id && !catSelected && reachedCatLimit; // can't add new category when limit reached

                          return (
                            <div key={`cat-${iIdx}-${cIdx}`} className="border rounded-lg">
                              <div className="flex items-center justify-between px-4 py-3">
                                <label
                                  className={`flex flex-1 items-center gap-2 ${
                                    catDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={catSelected}
                                    onChange={() => !catDisabled && cat.id && onToggleCat(cat.id)}
                                    disabled={!cat.id || catDisabled}
                                    title={
                                      !cat.id
                                        ? "Category not found in DB"
                                        : catDisabled
                                        ? "Category limit reached"
                                        : ""
                                    }
                                  />
                                  <span className="font-medium w-full flex-1 flex">{cat.name}</span>
                                </label>

                                {_hasSubs && (
                                  <button
                                    type="button"
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-expanded={catOpen}
                                    onClick={() => cat.id && onToggleCatOpen(cat.id)}
                                  >
                                    <span
                                      className={`inline-block transition-transform ${
                                        catOpen ? "rotate-180" : ""
                                      }`}
                                    >
                                      ▾
                                    </span>
                                  </button>
                                )}
                              </div>

                              {_hasSubs && catOpen && (
                                <div className="px-4 pb-4 space-y-3">
                                  {(cat.subcategories || []).map((sc, sIdx) => {
                                    const _hasSubsubs = hasSubsubs(sc);
                                    const isOpen = !!sc.id && openSubs.has(sc.id);
                                    const isSelected = !!sc.id && subIds.includes(sc.id);

                                    // If parent category isn't selected and limit is reached, block selecting this sub (it would auto-add category)
                                    const parentSelected = !!cat.id && catIds.includes(cat.id);
                                    const subDisabled = !isSelected && !parentSelected && reachedCatLimit;

                                    return (
                                      <div key={`sub-${iIdx}-${cIdx}-${sIdx}`} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                          <label
                                            className={`flex items-center w-full flex-1 gap-3 ${
                                              subDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 text-brand-600"
                                              checked={isSelected}
                                              onChange={() => !subDisabled && sc.id && onToggleSub(sc.id)}
                                              disabled={!sc.id || subDisabled}
                                              title={
                                                !sc.id
                                                  ? "Subcategory not found in DB"
                                                  : subDisabled
                                                  ? "Category limit reached"
                                                  : ""
                                              }
                                            />
                                            <span className="font-medium w-full flex flex-1">{sc.name}</span>
                                          </label>

                                          {_hasSubsubs && (
                                            <button
                                              type="button"
                                              onClick={() => sc.id && toggleSubOpen(sc.id)}
                                              className="text-gray-500 hover:text-gray-700"
                                              aria-expanded={isOpen}
                                              aria-label={`Toggle ${sc.name} sub-items`}
                                            >
                                              <span
                                                className={`inline-block transition-transform ${
                                                  isOpen ? "rotate-180" : ""
                                                }`}
                                              >
                                                ▾
                                              </span>
                                            </button>
                                          )}
                                        </div>

                                        {_hasSubsubs && (isOpen || isSelected) && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {sc.subsubs.map((ss, ssIdx) => {
                                              const parentCatSelected = !!cat.id && catIds.includes(cat.id);
                                              const ssSelected = !!ss.id && xIds.includes(ss.id);
                                              const ssDisabled = !ssSelected && !parentCatSelected && reachedCatLimit;
                                              return (
                                                <label
                                                  key={`ss-${iIdx}-${cIdx}-${sIdx}-${ssIdx}`}
                                                  className={`inline-flex items-center gap-2 px-2 py-1 border rounded-full text-sm ${
                                                    ssDisabled ? "opacity-50 cursor-not-allowed" : ""
                                                  }`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={!!ss.id && ssSelected}
                                                    onChange={() => !ssDisabled && ss.id && onToggleSubsub(ss.id)}
                                                    disabled={!ss.id || ssDisabled}
                                                    title={
                                                      !ss.id
                                                        ? "Level-3 not found in DB"
                                                        : ssDisabled
                                                        ? "Category limit reached"
                                                        : ""
                                                    }
                                                  />
                                                  <span>{ss.name}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={prev} className="rounded-xl border px-4 py-3">
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={!canNext}
              className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
            >
              {nextLabel}
            </button>
          </div>
        </main>
      </>
    );
  }

  // ------- Render steps -------

  return (
    <div className="min-h-screen p-6 bg-brand-50/40">
      {/* STEP 1: Who you are (DO) */}
      {step === 1 && (
        <IdentityStep
          title={userAccountType === "company" ? "Tell us about your company" : "Tell us who you are"}
          subtitle={
            userAccountType === "company"
              ? "Choose the identity that best represents what your company does."
              : "Choose the identity that best represents what you do."
          }
          picked={identityIds}
          onToggle={toggleIdentityDoes}
          next={() => setStep(2)}
          canNext={canContinue1}
          limit={1}
        />
      )}

      {/* STEP 2: Where you belong (DO) */}
      {step === 2 && (
        <CategoryTreeStep
          title={userAccountType === "company" ? "Choose your company's focus areas" : "Choose where you belong"}
          subtitle={
            userAccountType === "company"
              ? "Select the categories that match your company's expertise and activity."
              : "Select the categories that match your expertise and activity."
          }
          selectedIdentities={selectedIdentitiesDoes}
          catIds={categoryIds}
          subIds={subcategoryIds}
          xIds={subsubCategoryIds}
          openCats={openCatsDoes}
          openSubs={openSubsDoes}
          onToggleCat={toggleCategoryDoes}
          onToggleSub={toggleSubDoes}
          onToggleSubsub={toggleSubsubDoes}
          onToggleCatOpen={handleCatOpenDoes}
          toggleSubOpen={toggleSubOpenDoes}
          prev={() => setStep(1)}
          nextLabel="Continue"
          onNext={() => setStep(3)}
          canNext={canContinue2}
        />
      )}

      {/* STEP 3: What you're looking for (WANT) — MAX 3 identities */}
      {step === 3 && (
        <IdentityStep
          title={userAccountType === "company" ? "What is your company looking for?" : "What are you looking for?"}
          subtitle={
            userAccountType === "company"
              ? "Pick the identities your company wants to connect with or discover."
              : "Pick the identities you want to connect with or discover."
          }
          picked={interestIdentityIds}
          onToggle={toggleIdentityWant}
          next={() => setStep(4)}
          canNext={canContinue3}
          prev={() => setStep(2)}
          limit={MAX_WANT_IDENTITIES}
        />
      )}

      {/* STEP 4: Categories you're looking for (WANT) — MAX 3 categories */}
      {step === 4 && (
        <CategoryTreeStep
          title={
            userAccountType === "company"
              ? "Pick the categories your company is looking for"
              : "Pick the categories you are looking for"
          }
          subtitle={
            userAccountType === "company"
              ? "Select categories and roles your company wants to find."
              : "Select categories and roles you want to find."
          }
          selectedIdentities={selectedIdentitiesWant}
          catIds={interestCategoryIds}
          subIds={interestSubcategoryIds}
          xIds={interestSubsubCategoryIds}
          openCats={openCatsWant}
          openSubs={openSubsWant}
          onToggleCat={toggleCategoryWant}
          onToggleSub={toggleSubWant}
          onToggleSubsub={toggleSubsubWant}
          onToggleCatOpen={handleCatOpenWant}
          toggleSubOpen={toggleSubOpenWant}
          prev={() => setStep(3)}
          nextLabel="Continue"
          onNext={() => setStep(5)}
          canNext={canContinue4}
          catLimit={MAX_WANT_CATEGORIES}
        />
      )}

      {/* STEP 5: Industry selection */}
      {step === 5 && (
        <IndustryTreeStep
          title={userAccountType === "company" ? "Choose your company's industry focus" : "Choose your industry focus"}
          subtitle={
            userAccountType === "company"
              ? "Select the industries that best represent your company's sector and expertise."
              : "Select the industries that best represent your professional sector and expertise."
          }
          industryCatIds={industryCategoryIds}
          industrySubIds={industrySubcategoryIds}
          industryXIds={industrySubsubCategoryIds}
          openIndustryCats={openIndustryCats}
          openIndustrySubs={openIndustrySubs}
          onToggleIndustryCat={toggleIndustryCategory}
          onToggleIndustrySub={toggleIndustrySub}
          onToggleIndustrySubsub={toggleIndustrySubsub}
          onToggleIndustryCatOpen={handleIndustryCatOpen}
          toggleIndustrySubOpen={toggleIndustrySubOpen}
          prev={() => setStep(4)}
          nextLabel="Save & Finish"
          onNext={async () => {
            if (!canFinish) return;
            try {
              await client.post("/onboarding/oneshot", {
                // DOES
                identityIds,
                categoryIds,
                subcategoryIds,
                subsubCategoryIds,
                // WANTS
                interestIdentityIds,
                interestCategoryIds,
                interestSubcategoryIds,
                interestSubsubCategoryIds,
                // INDUSTRIES
                industryCategoryIds,
                industrySubcategoryIds,
                industrySubsubCategoryIds,
              });
              window.location.href = "/";
            } catch (e) {
              console.error(e);
              alert("Failed to save. Please try again.");
            }
          }}
          canNext={canFinish}
        />
      )}
    </div>
  );
}

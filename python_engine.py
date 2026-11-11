"""DealFlow Alpha 01.2 reference engine.

Probabilities are percentages (0..100) in both Python and JavaScript.
The optimizer is deterministic and assumption-driven; it is not an AI predictor
and does not establish causal financial impact.
"""
from dataclasses import dataclass
from typing import Optional

MAX_ACTIONS = 20
EVIDENCE_STATUSES = {"unverified", "user_reported", "documented", "verified"}

@dataclass
class Action:
    id: str
    commission: float
    p_with: float
    p_without: float
    effort_minutes: int
    deadline_hours: float
    dependency: Optional[str] = None
    opportunity_id: Optional[str] = None
    confidence: float = 50
    evidence_status: str = "unverified"
    evidence_url: str = ""
    evidence_updated_at: str = ""
    evidence_note: str = ""

    @property
    def incremental_commission(self):
        return self.commission * (self.p_with - self.p_without) / 100


def _get(a, key, default=None):
    return getattr(a, key, default)


def validate_portfolio(actions, capacity_hours, completed_ids=()):
    errors = []
    if not isinstance(actions, (list, tuple)):
        return ["Actions must be a list or tuple."]
    if not isinstance(capacity_hours, (int, float)) or isinstance(capacity_hours, bool) or not 0 < capacity_hours <= 24:
        errors.append("Capacity must be greater than 0 and no more than 24 hours.")
    if len(actions) > MAX_ACTIONS:
        errors.append(f"At most {MAX_ACTIONS} actions are supported.")
    ids = set()
    for a in actions:
        if not isinstance(a, Action):
            errors.append("Every item must be an Action instance.")
            continue
        if not isinstance(a.id, str) or not a.id.strip(): errors.append("Every action needs a non-empty ID.")
        elif a.id in ids: errors.append(f"Duplicate action ID: {a.id}.")
        else: ids.add(a.id)
        for key, lo, hi in (("commission",0,1e9),("p_with",0,100),("p_without",0,100),("effort_minutes",1,10080),("deadline_hours",0,8760),("confidence",0,100)):
            value = getattr(a,key)
            if not isinstance(value,(int,float)) or isinstance(value,bool) or not lo <= value <= hi:
                errors.append(f"{a.id}: {key} must be between {lo} and {hi}.")
        if a.dependency == a.id: errors.append(f"{a.id}: an action cannot depend on itself.")
        if a.opportunity_id is not None and (not isinstance(a.opportunity_id,str) or not a.opportunity_id.strip()):
            errors.append(f"{a.id}: opportunity_id must be a non-empty string when supplied.")
        if a.evidence_status not in EVIDENCE_STATUSES:
            errors.append(f"{a.id}: evidence_status must be one of {', '.join(sorted(EVIDENCE_STATUSES))}.")
        for field in ("evidence_url", "evidence_updated_at", "evidence_note"):
            if not isinstance(getattr(a,field),str): errors.append(f"{a.id}: {field} must be text.")
    completed = set(completed_ids)
    by_id = {a.id:a for a in actions if isinstance(a,Action) and isinstance(a.id,str)}
    for a in actions:
        if isinstance(a,Action) and a.dependency and a.dependency not in by_id and a.dependency not in completed:
            errors.append(f"{a.id}: prerequisite {a.dependency} is neither in this portfolio nor marked completed.")
    visiting=set(); visited=set()
    def visit(action_id):
        if action_id in visiting:
            errors.append(f"Dependency cycle detected at {action_id}."); return
        if action_id in visited: return
        visiting.add(action_id)
        dep=by_id[action_id].dependency
        if dep in by_id: visit(dep)
        visiting.remove(action_id); visited.add(action_id)
    for action_id in by_id: visit(action_id)
    return list(dict.fromkeys(errors))


def _portfolio_value(items):
    """Count positive commission lift once per opportunity; retain negative prerequisite costs."""
    positive_by_opportunity = {}
    negative_total = 0.0
    for a in items:
        lift = a.incremental_commission
        if lift < 0:
            negative_total += lift
        else:
            key = (a.opportunity_id or a.id).strip().lower()
            positive_by_opportunity[key] = max(positive_by_opportunity.get(key, 0.0), lift)
    return negative_total + sum(positive_by_opportunity.values())


def schedule(items, completed_ids=()):
    """Return the first feasible precedence-respecting schedule for a fixed action set."""
    items=list(items); external=set(completed_ids); by_id={a.id:i for i,a in enumerate(items)}
    if any(a.dependency and a.dependency not in by_id and a.dependency not in external for a in items): return None
    visited=set(); n=len(items)
    def visit(mask, minutes, order):
        if mask==(1<<n)-1: return {"minutes":minutes,"order":order}
        if mask in visited: return None
        visited.add(mask)
        ready=[]
        for i,a in enumerate(items):
            if mask&(1<<i): continue
            if a.dependency and a.dependency not in external:
                dep=by_id.get(a.dependency)
                if dep is None or not(mask&(1<<dep)): continue
            ready.append(i)
        ready.sort(key=lambda i:(items[i].deadline_hours,items[i].effort_minutes,items[i].id))
        for i in ready:
            a=items[i]; finish=minutes+a.effort_minutes
            if finish>a.deadline_hours*60+1e-9: continue
            result=visit(mask|(1<<i),finish,order+[(a.id,minutes,finish)])
            if result is not None: return result
        return None
    return visit(0,0,[])


def optimize(actions, capacity_hours, completed_ids=()):
    """Exact precedence/deadline-aware search over reachable schedule prefixes.

    With at most 20 actions, memoizing selected bitmasks avoids the former EDF
    false negatives while bounding the state space to 2^N.
    """
    errors=validate_portfolio(actions,capacity_hours,completed_ids)
    if errors: raise ValueError(" ".join(errors))
    candidates=[a for a in actions if a.effort_minutes <= capacity_hours*60]
    n=len(candidates); done_external=set(completed_ids)
    index={a.id:i for i,a in enumerate(candidates)}
    deps=[]
    for a in candidates:
        deps.append(index.get(a.dependency) if a.dependency in index else None)
    efforts=[a.effort_minutes for a in candidates]
    deadlines=[a.deadline_hours*60 for a in candidates]
    full=(1<<n)-1; visited=set()
    best={"value":0.0,"minutes":0,"items":[],"schedule":[]}
    def visit(mask, minutes, order):
        nonlocal best
        if mask in visited: return
        visited.add(mask)
        selected=[candidates[i] for i in range(n) if mask & (1<<i)]
        value=_portfolio_value(selected)
        ids=[a.id for a in selected]
        if (value > best["value"] + 1e-9 or
            (abs(value-best["value"])<=1e-9 and value>0 and (len(selected)<len(best["items"]) or (len(selected)==len(best["items"]) and minutes<best["minutes"])))):
            best={"value":value,"minutes":minutes,"items":[candidates[i] for i,_,_ in order],"schedule":[(candidates[i].id,s,e) for i,s,e in order]}
        for i,a in enumerate(candidates):
            bit=1<<i
            if mask & bit: continue
            dep=deps[i]
            if a.dependency and a.dependency not in done_external and (dep is None or not (mask & (1<<dep))): continue
            finish=minutes+efforts[i]
            if finish>capacity_hours*60+1e-9 or finish>deadlines[i]+1e-9: continue
            visit(mask|bit,finish,order+[(i,minutes,finish)])
    visit(0,0,[])
    return best


def greedy(actions, capacity_hours, score_fn, completed_ids=()):
    """Baseline heuristic, evaluated with the same portfolio accounting and feasibility rules."""
    errors=validate_portfolio(actions,capacity_hours,completed_ids)
    if errors: raise ValueError(" ".join(errors))
    ordered=sorted((a for a in actions if a.incremental_commission>0),key=score_fn,reverse=True)
    chosen=[]
    for action in ordered:
        trial=chosen+[action]
        try: result=optimize(trial,capacity_hours,completed_ids)
        except ValueError: continue
        if {x.id for x in result["items"]}=={x.id for x in trial}: chosen=trial
    return optimize(chosen,capacity_hours,completed_ids)

if __name__ == "__main__":
    demo=[
      Action("A",24000,58,38,75,5,opportunity_id="D1"),
      Action("B",18000,52,43,45,12,opportunity_id="D2"),
      Action("C",32000,42,24,110,24,opportunity_id="D3"),
      Action("D",21000,63,57,35,3,opportunity_id="D4"),
      Action("E",45000,30,18,90,48,opportunity_id="D5"),
      Action("F",16000,55,35,30,8,opportunity_id="D6"),
      Action("G",9000,48,40,40,36,opportunity_id="D7"),
      Action("H",38000,46,29,100,6,opportunity_id="D8"),
    ]
    result=optimize(demo,6)
    print("Expected incremental commission:",round(result["value"],2),"AED")
    print("Time allocated:",result["minutes"],"minutes")
    print("Scheduled:",", ".join(f"{x[0]} ({x[1]}–{x[2]} min)" for x in result["schedule"]))
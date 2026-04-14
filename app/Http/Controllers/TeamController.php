<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $teams = $user->teams()->with(['owner', 'users'])->withCount('proxySites')->get();
        $ownedTeams = $user->ownedTeams()->with('users')->withCount('proxySites')->get();

        return Inertia::render('Teams/Index', [
            'teams'      => $teams,
            'ownedTeams' => $ownedTeams,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);

        $team = Team::create([
            'name'     => $validated['name'],
            'owner_id' => auth()->id(),
        ]);

        // Owner is also a member with admin role
        $team->users()->attach(auth()->id(), ['role' => 'admin']);

        auth()->user()->update(['current_team_id' => $team->id]);

        return redirect()->back()->with('success', 'Team created.');
    }

    public function invite(Request $request, Team $team)
    {
        $this->authorizeTeamAdmin($team);

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'role'  => 'required|in:admin,member,viewer',
        ]);

        $invitee = User::where('email', $validated['email'])->firstOrFail();

        if ($team->users()->where('user_id', $invitee->id)->exists()) {
            return redirect()->back()->withErrors(['email' => 'User is already a member.']);
        }

        $team->users()->attach($invitee->id, ['role' => $validated['role']]);

        return redirect()->back()->with('success', 'User invited.');
    }

    public function removeMember(Team $team, User $user)
    {
        $this->authorizeTeamAdmin($team);
        abort_if($user->id === $team->owner_id, 403, 'Cannot remove the team owner.');

        $team->users()->detach($user->id);

        return redirect()->back()->with('success', 'Member removed.');
    }

    public function switchTeam(Request $request)
    {
        $validated = $request->validate(['team_id' => 'required|exists:teams,id']);

        $team = Team::findOrFail($validated['team_id']);
        $user = auth()->user();

        abort_unless(
            $user->teams()->where('team_id', $team->id)->exists() || $team->owner_id === $user->id,
            403
        );

        $user->update(['current_team_id' => $team->id]);

        return redirect()->back()->with('success', "Switched to {$team->name}.");
    }

    public function destroy(Team $team)
    {
        abort_if($team->owner_id !== auth()->id(), 403);
        $team->delete();

        return redirect()->route('teams.index')->with('success', 'Team deleted.');
    }

    private function authorizeTeamAdmin(Team $team): void
    {
        $user = auth()->user();
        $isAdmin = $team->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'admin')
            ->exists();

        abort_unless($isAdmin || $team->owner_id === $user->id, 403);
    }
}

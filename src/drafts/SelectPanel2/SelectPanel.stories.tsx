import React from 'react'
import {SelectPanel} from './SelectPanel'
import {ActionList, Avatar, Box, Button} from '../../../src/index'
import {GitBranchIcon, TriangleDownIcon} from '@primer/octicons-react'
import data from './mock-data'

const getCircle = (color: string) => (
  <Box sx={{width: 14, height: 14, borderRadius: '100%'}} style={{backgroundColor: `#${color}`}} />
)

export const AControlled = () => {
  const [filteredLabels, setFilteredLabels] = React.useState(data.labels)

  const initialSelectedLabels: string[] = [] // initial state: no labels
  // const initialSelectedLabels = data.issue.labelIds // initial state: has labels

  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>(initialSelectedLabels)

  const [query, setQuery] = React.useState('')

  // TODO: should this be baked-in
  const onSearchInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value
    setQuery(query)

    if (query === '') setFilteredLabels(data.labels)
    else {
      // TODO: should probably add a highlight for matching text
      setFilteredLabels(
        data.labels
          .map(label => {
            if (label.name.toLowerCase().startsWith(query)) return {priority: 1, label}
            else if (label.name.toLowerCase().includes(query)) return {priority: 2, label}
            else if (label.description?.toLowerCase().includes(query)) return {priority: 3, label}
            else return {priority: -1, label}
          })
          .filter(result => result.priority > 0)
          .map(result => result.label),
      )
    }
  }

  const onLabelSelect = (labelId: string) => {
    if (!selectedLabelIds.includes(labelId)) setSelectedLabelIds([...selectedLabelIds, labelId])
    else setSelectedLabelIds(selectedLabelIds.filter(id => id !== labelId))
  }

  const onClearSelection = () => {
    // soft set, does not save until submit
    setSelectedLabelIds([])
  }

  const onSubmit = (event: {preventDefault: () => void}) => {
    event.preventDefault() // coz form submit, innit
    data.issue.labelIds = selectedLabelIds // pretending to persist changes

    // eslint-disable-next-line no-console
    console.log('form submitted')
  }

  const sortingFn = (labelA: {id: string}, labelB: {id: string}) => {
    /* Important! This sorting is only for initial selected ids, not for subsequent changes!
      deterministic sorting for better UX: don't change positions with other selected items.

      TODO: should this sorting be baked-in OR we only validate + warn OR do nothing
      need to either own or accept the selection state to make that automatic
      OR provide a API for sorting in ActionList like sort by key or sort fn
    */
    if (selectedLabelIds.includes(labelA.id) && selectedLabelIds.includes(labelB.id)) return 1
    else if (selectedLabelIds.includes(labelA.id)) return -1
    else if (selectedLabelIds.includes(labelB.id)) return 1
    else return 1
  }

  return (
    <>
      <h1>Controlled SelectPanel</h1>

      <SelectPanel
        // onSubmit and onCancel feel out of place here instead of the footer,
        // but cancel can be called from 4 different actions - Cancel button, X iconbutton up top, press escape key, click outside
        // also, what if there is no footer? onSubmit is maybe not needed, but we need to put the onCancel callback somewhere.
        onSubmit={onSubmit}
        onCancel={() => {
          /* optional callback, for example: for multi-step overlay or to fire sync actions */
          // eslint-disable-next-line no-console
          console.log('panel was closed')
        }}
        // TODO: onClearSelection feels even more odd on the parent, instead of on the header.
        // @ts-ignore todo
        onClearSelection={event => {
          // not optional, we don't control the selection, so we just pass this through
          // @ts-ignore todo
          onClearSelection(event)
        }}
      >
        {/* TODO: the ref types don't match here, use useProvidedRefOrCreate */}
        {/* @ts-ignore todo */}
        <SelectPanel.Button>Assign label</SelectPanel.Button>
        {/* TODO: header and heading is confusing. maybe skip header completely. */}
        <SelectPanel.Header>
          {/* TODO: Heading is not optional, but what if you don't give it
              Should we throw a big error or should we make that impossible in the API?
          */}
          <SelectPanel.Heading>Select labels</SelectPanel.Heading>
          <SelectPanel.SearchInput onChange={onSearchInputChange} />
        </SelectPanel.Header>
        <SelectPanel.ActionList>
          {/* slightly different view for search results view and list view */}
          {query ? (
            filteredLabels.length > 1 ? (
              filteredLabels.map(label => (
                <ActionList.Item
                  key={label.id}
                  onSelect={() => onLabelSelect(label.id)}
                  selected={selectedLabelIds.includes(label.id)}
                >
                  <ActionList.LeadingVisual>{getCircle(label.color)}</ActionList.LeadingVisual>
                  {label.name}
                  <ActionList.Description variant="block">{label.description}</ActionList.Description>
                </ActionList.Item>
              ))
            ) : (
              <SelectPanel.EmptyMessage>No labels found for &quot;{query}&quot;</SelectPanel.EmptyMessage>
            )
          ) : (
            <>
              {data.labels.sort(sortingFn).map((label, index) => {
                /* 
                  we want to render a divider between the group of selected and unselected items.
                  kinda hack: if this is the last item that is selected, render an divider after it
                  TODO: can this be cleaner?
                */
                const nextLabel = data.labels.sort(sortingFn)[index + 1]
                const showDivider = selectedLabelIds.includes(label.id) && !selectedLabelIds.includes(nextLabel?.id)

                return (
                  <>
                    <ActionList.Item
                      key={label.id}
                      onSelect={() => onLabelSelect(label.id)}
                      selected={selectedLabelIds.includes(label.id)}
                    >
                      <ActionList.LeadingVisual>{getCircle(label.color)}</ActionList.LeadingVisual>
                      {label.name}
                      <ActionList.Description variant="block">{label.description}</ActionList.Description>
                    </ActionList.Item>
                    {showDivider ? <ActionList.Divider /> : null}
                  </>
                )
              })}
            </>
          )}
        </SelectPanel.ActionList>
        <SelectPanel.Footer>
          <SelectPanel.SecondaryButton>Edit labels</SelectPanel.SecondaryButton>
        </SelectPanel.Footer>
      </SelectPanel>
    </>
  )
}

export const BWithSuspendedList = () => {
  const [query, setQuery] = React.useState('')

  const onSearchInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value
    setQuery(query)
  }

  return (
    <>
      <h1>Suspended list</h1>
      <p>Fetching items once when the panel is opened (like repo labels)</p>
      <SelectPanel>
        {/* @ts-ignore todo */}
        <SelectPanel.Button>Assign label</SelectPanel.Button>

        <SelectPanel.Header>
          <SelectPanel.Heading>Select labels</SelectPanel.Heading>
          <SelectPanel.SearchInput onChange={onSearchInputChange} />
        </SelectPanel.Header>

        <React.Suspense fallback={<SelectPanel.Loading>Fetching labels...</SelectPanel.Loading>}>
          <SuspendedActionList query={query} />
          <SelectPanel.Footer>
            <SelectPanel.SecondaryButton>Edit labels</SelectPanel.SecondaryButton>
          </SelectPanel.Footer>
        </React.Suspense>
      </SelectPanel>
    </>
  )
}

const SuspendedActionList: React.FC<{query: string}> = ({query}) => {
  const fetchedData: typeof data = use(getData({key: 'suspended-action-list'}))

  const initialSelectedLabels: string[] = fetchedData.issue.labelIds
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>(initialSelectedLabels)

  const onLabelSelect = (labelId: string) => {
    if (!selectedLabelIds.includes(labelId)) setSelectedLabelIds([...selectedLabelIds, labelId])
    else setSelectedLabelIds(selectedLabelIds.filter(id => id !== labelId))
  }

  const sortingFn = (labelA: {id: string}, labelB: {id: string}) => {
    if (selectedLabelIds.includes(labelA.id) && selectedLabelIds.includes(labelB.id)) return 1
    else if (selectedLabelIds.includes(labelA.id)) return -1
    else if (selectedLabelIds.includes(labelB.id)) return 1
    else return 1
  }

  const filteredLabels = fetchedData.labels
    .map(label => {
      if (label.name.toLowerCase().startsWith(query)) return {priority: 1, label}
      else if (label.name.toLowerCase().includes(query)) return {priority: 2, label}
      else if (label.description?.toLowerCase().includes(query)) return {priority: 3, label}
      else return {priority: -1, label}
    })
    .filter(result => result.priority > 0)
    .map(result => result.label)

  return (
    <SelectPanel.ActionList>
      {/* slightly different view for search results view and list view */}
      {query ? (
        filteredLabels.map(label => (
          <ActionList.Item
            key={label.id}
            onSelect={() => onLabelSelect(label.id)}
            selected={selectedLabelIds.includes(label.id)}
          >
            <ActionList.LeadingVisual>{getCircle(label.color)}</ActionList.LeadingVisual>
            {label.name}
            <ActionList.Description variant="block">{label.description}</ActionList.Description>
          </ActionList.Item>
        ))
      ) : (
        <>
          {fetchedData.labels.sort(sortingFn).map((label, index) => {
            const nextLabel = fetchedData.labels.sort(sortingFn)[index + 1]
            const showDivider = selectedLabelIds.includes(label.id) && !selectedLabelIds.includes(nextLabel?.id)

            return (
              <>
                <ActionList.Item
                  key={label.id}
                  onSelect={() => onLabelSelect(label.id)}
                  selected={selectedLabelIds.includes(label.id)}
                >
                  <ActionList.LeadingVisual>{getCircle(label.color)}</ActionList.LeadingVisual>
                  {label.name}
                  <ActionList.Description variant="block">{label.description}</ActionList.Description>
                </ActionList.Item>
                {showDivider ? <ActionList.Divider /> : null}
              </>
            )
          })}
        </>
      )}
    </SelectPanel.ActionList>
  )
}

export const CAsyncSearchWithSuspenseKey = () => {
  // issue `data` is already pre-fetched
  // `users` are fetched async on search

  const [query, setQuery] = React.useState('')
  const onSearchInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value
    setQuery(query)
  }

  return (
    <>
      <h1>Async search with useTransition</h1>
      <p>Fetching items on every keystroke search (like github users)</p>

      <SelectPanel defaultOpen={true}>
        {/* @ts-ignore todo */}
        <SelectPanel.Button>Select assignees</SelectPanel.Button>
        <SelectPanel.Header>
          <SelectPanel.Heading>Select collaborators</SelectPanel.Heading>
          <SelectPanel.SearchInput onChange={onSearchInputChange} />
        </SelectPanel.Header>

        {/* Reset suspense boundary to trigger refetch on query
            Docs reference: https://react.dev/reference/react/Suspense#resetting-suspense-boundaries-on-navigation
        */}
        <React.Suspense key={query} fallback={<SelectPanel.Loading>Fetching users...</SelectPanel.Loading>}>
          <SearchableUserList query={query} />
          <SelectPanel.Footer />
        </React.Suspense>
      </SelectPanel>
    </>
  )
}

const SearchableUserList: React.FC<{query: string; showLoading?: boolean}> = ({query, showLoading = false}) => {
  // issue `data` is already pre-fetched
  const repository = {collaborators: data.collaborators}
  // `users` are fetched async on search
  const filteredUsers: typeof data.users = query ? use(queryUsers({query})) : []

  const initialSelectedUsers: string[] = data.issue.assigneeIds
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>(initialSelectedUsers)

  const onUserSelect = (userId: string) => {
    if (!selectedUserIds.includes(userId)) setSelectedUserIds([...selectedUserIds, userId])
    else setSelectedUserIds(selectedUserIds.filter(id => id !== userId))
  }

  const sortingFn = (userA: {id: string}, userB: {id: string}) => {
    if (selectedUserIds.includes(userA.id) && selectedUserIds.includes(userB.id)) return 1
    else if (selectedUserIds.includes(userA.id)) return -1
    else if (selectedUserIds.includes(userB.id)) return 1
    else return 1
  }

  // only used with useTransition example
  if (showLoading) return <SelectPanel.Loading>Search for users...</SelectPanel.Loading>

  /* slightly different view for search results view and list view */
  if (query) {
    return (
      <SelectPanel.ActionList>
        {filteredUsers.map(user => (
          <ActionList.Item
            key={user.id}
            onSelect={() => onUserSelect(user.id)}
            selected={selectedUserIds.includes(user.id)}
          >
            <ActionList.LeadingVisual>
              <Avatar src={`https://github.com/${user.login}.png`} />
            </ActionList.LeadingVisual>
            {user.login}
            <ActionList.Description>{user.name}</ActionList.Description>
          </ActionList.Item>
        ))}
      </SelectPanel.ActionList>
    )
  } else {
    return (
      <SelectPanel.ActionList>
        {repository.collaborators.sort(sortingFn).map((user, index) => {
          // tiny bit of additional logic to show divider
          const nextUser = repository.collaborators.sort(sortingFn)[index + 1]
          const showDivider = selectedUserIds.includes(user.id) && !selectedUserIds.includes(nextUser?.id)
          return (
            <>
              <ActionList.Item
                key={user.id}
                onSelect={() => onUserSelect(user.id)}
                selected={selectedUserIds.includes(user.id)}
              >
                <ActionList.LeadingVisual>
                  <Avatar src={`https://github.com/${user.login}.png`} />
                </ActionList.LeadingVisual>
                {user.login}
                <ActionList.Description>{user.name}</ActionList.Description>
              </ActionList.Item>
              {showDivider ? <ActionList.Divider /> : null}
            </>
          )
        })}
      </SelectPanel.ActionList>
    )
  }
}

export const DAsyncSearchWithUseTransition = () => {
  // issue `data` is already pre-fetched
  // `users` are fetched async on search

  const [isPending, startTransition] = React.useTransition()

  const [query, setQuery] = React.useState('')
  const onSearchInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value
    startTransition(() => setQuery(query))
  }

  return (
    <>
      <h1>Async search with useTransition</h1>
      <p>Fetching items on every keystroke search (like github users)</p>

      <SelectPanel defaultOpen={true}>
        {/* @ts-ignore todo */}
        <SelectPanel.Button>Select assignees</SelectPanel.Button>
        <SelectPanel.Header>
          <SelectPanel.Heading>Select collaborators</SelectPanel.Heading>
          <SelectPanel.SearchInput onChange={onSearchInputChange} />
        </SelectPanel.Header>

        <React.Suspense fallback={<SelectPanel.Loading>Fetching users...</SelectPanel.Loading>}>
          <SearchableUserList query={query} showLoading={isPending} />
          <SelectPanel.Footer />
        </React.Suspense>
      </SelectPanel>
    </>
  )
}

export const TODO1Uncontrolled = () => {
  /* features to implement:
     1. search
     2. sort + divider
     3. selection
     4. clear selection
     5. different results view
     6. submit -> pass data / pull from form
     8. cancel callback
     9. empty state
  */

  const onSubmit = (event: {preventDefault: () => void}) => {
    event.preventDefault() // coz form submit, innit

    // TODO: where does saved data come from?
    // data.issue.labelIds = selectedLabelIds // pretending to persist changes

    // eslint-disable-next-line no-console
    console.log('form submitted')
  }

  const onCancel = () => {
    // eslint-disable-next-line no-console
    console.log('panel was closed')
  }

  return (
    <>
      <h1>Does not work yet: Uncontrolled SelectPanel</h1>

      <SelectPanel onSubmit={onSubmit} onCancel={onCancel}>
        {/* @ts-ignore todo */}
        <SelectPanel.Button>Assign label</SelectPanel.Button>

        <SelectPanel.Header>
          <SelectPanel.Heading>Select labels</SelectPanel.Heading>
          <SelectPanel.SearchInput />
        </SelectPanel.Header>

        <SelectPanel.ActionList>
          {data.labels.map(label => (
            <ActionList.Item key={label.id}>
              <ActionList.LeadingVisual>{getCircle(label.color)}</ActionList.LeadingVisual>
              {label.name}
              <ActionList.Description variant="block">{label.description}</ActionList.Description>
            </ActionList.Item>
          ))}
        </SelectPanel.ActionList>

        <SelectPanel.Footer>
          <SelectPanel.SecondaryButton>Edit labels</SelectPanel.SecondaryButton>
        </SelectPanel.Footer>
      </SelectPanel>
    </>
  )
}

export const TODO2SingleSelection = () => <h1>TODO</h1>

export const TODO3NoCustomisation = () => {
  return (
    <>
      <h1>TODO: Without any customisation</h1>
      <p>Address after TODO: Uncontrolled</p>
    </>
  )
}

export const TODO4WithFilterButtons = () => {
  const [selectedFilter, setSelectedFilter] = React.useState<'branches' | 'tags'>('branches')
  const [filteredRefs, setFilteredRefs] = React.useState(data.branches)

  const initialSelectedLabels: string[] = ['main']

  // TODO: Single selection doesn't need an array
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>(initialSelectedLabels)

  const setSearchResults = (query: string, selectedFilter: 'branches' | 'tags') => {
    if (query === '') setFilteredRefs(data[selectedFilter])
    else {
      // TODO: should probably add a highlight for matching text
      // TODO: This should be a joined array, not seperate, only separated at the render level
      setFilteredRefs(
        data[selectedFilter]
          .map(item => {
            if (item.name.toLowerCase().startsWith(query)) return {priority: 1, item}
            else if (item.name.toLowerCase().includes(query)) return {priority: 2, item}
            else return {priority: -1, item}
          })
          .filter(result => result.priority > 0)
          .map(result => result.item),
      )
    }
  }

  const [query, setQuery] = React.useState('')
  const onSearchInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value
    setQuery(query)
  }

  React.useEffect(
    function updateSearchResults() {
      setSearchResults(query, selectedFilter)
    },
    [query, selectedFilter],
  )

  const onLabelSelect = (labelId: string) => {
    if (!selectedLabelIds.includes(labelId)) setSelectedLabelIds([...selectedLabelIds, labelId])
    else setSelectedLabelIds(selectedLabelIds.filter(id => id !== labelId))
  }

  const onSubmit = (event: {preventDefault: () => void}) => {
    event.preventDefault() // coz form submit, innit
    data.issue.labelIds = selectedLabelIds // pretending to persist changes

    // eslint-disable-next-line no-console
    console.log('form submitted')
  }

  const sortingFn = (branchA: {id: string}, branchB: {id: string}) => {
    /* Important! This sorting is only for initial selected ids, not for subsequent changes!
      deterministic sorting for better UX: don't change positions with other selected items.
    */
    if (selectedLabelIds.includes(branchA.id) && selectedLabelIds.includes(branchB.id)) return 1
    else if (selectedLabelIds.includes(branchA.id)) return -1
    else if (selectedLabelIds.includes(branchB.id)) return 1
    else return 1
  }

  return (
    <>
      <h1>With Filter Buttons</h1>

      <SelectPanel
        defaultOpen
        onSubmit={onSubmit}
        onCancel={() => {
          // eslint-disable-next-line no-console
          console.log('panel was closed')
        }}
      >
        {/* TODO: the ref types don't match here, use useProvidedRefOrCreate */}
        {/* @ts-ignore todo */}
        <SelectPanel.Button leadingIcon={GitBranchIcon} trailingIcon={TriangleDownIcon}>
          main
        </SelectPanel.Button>

        <SelectPanel.Header>
          <SelectPanel.Heading>Switch branches/tags</SelectPanel.Heading>
          <SelectPanel.SearchInput onChange={onSearchInputChange} sx={{marginBottom: 2}} />

          <Box id="filters" sx={{display: 'flex'}}>
            <Button
              variant="invisible"
              sx={{fontWeight: selectedFilter === 'branches' ? 'semibold' : 'normal', color: 'fg.default'}}
              onClick={() => setSelectedFilter('branches')}
            >
              Branches <Button.Counter>{20}</Button.Counter>
            </Button>
            <Button
              variant="invisible"
              sx={{fontWeight: selectedFilter === 'tags' ? 'semibold' : 'normal', color: 'fg.default'}}
              onClick={() => setSelectedFilter('tags')}
            >
              Tags <Button.Counter>{8}</Button.Counter>
            </Button>
          </Box>
        </SelectPanel.Header>

        <SelectPanel.ActionList selectionVariant="single">
          {/* slightly different view for search results view and list view */}
          {query ? (
            filteredRefs.length > 1 ? (
              filteredRefs.map(label => (
                <ActionList.Item
                  key={label.id}
                  onSelect={() => onLabelSelect(label.id)}
                  selected={selectedLabelIds.includes(label.id)}
                >
                  {label.name}
                  <ActionList.TrailingVisual>{label.trailingInfo}</ActionList.TrailingVisual>
                </ActionList.Item>
              ))
            ) : (
              <SelectPanel.EmptyMessage>
                No {selectedFilter} found for &quot;{query}&quot;
              </SelectPanel.EmptyMessage>
            )
          ) : (
            <>
              {data[selectedFilter].sort(sortingFn).map(item => {
                return (
                  <>
                    <ActionList.Item
                      key={item.id}
                      onSelect={() => onLabelSelect(item.id)}
                      selected={selectedLabelIds.includes(item.id)}
                    >
                      {item.name}
                      <ActionList.TrailingVisual>{item.trailingInfo}</ActionList.TrailingVisual>
                    </ActionList.Item>
                  </>
                )
              })}
            </>
          )}
        </SelectPanel.ActionList>
        <SelectPanel.Footer>
          {/* TODO: Can't disable Cancel and Save yet */}
          <SelectPanel.SecondaryButton as="a" href={`/${selectedFilter}`}>
            View all {selectedFilter}
          </SelectPanel.SecondaryButton>
        </SelectPanel.Footer>
      </SelectPanel>
    </>
  )
}

// ----- Suspense implementation details ----

const cache = new Map()
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getData = ({key = '0', delay = 1000}: {key: string; delay?: number}) => {
  if (!cache.has(key)) cache.set(key, fetchData(delay))
  return cache.get(key)
}
// return a promise!
const fetchData = async (delay: number) => {
  await sleep(delay)
  return data
}

const queryUsers = ({query = '', delay = 500}: {query: string; delay?: number}) => {
  const key = `users-${query}`
  if (!cache.has(key)) cache.set(key, fetchUsers(query, delay))
  return cache.get(key)
}
const fetchUsers = async (query: string, delay: number) => {
  await sleep(delay)
  return data.users.filter(user => {
    return (
      user.login.toLowerCase().includes(query.toLowerCase()) || user.name.toLowerCase().includes(query.toLowerCase())
    )
  })
  // i went harder on this than is necessary 😅
  // .map(user => {
  //   if (user.login.toLowerCase().startsWith(query)) return {priority: 1, user}
  //   else if (user.login.toLowerCase().includes(query)) return {priority: 2, user}
  //   else if (user.name.toLowerCase().includes(query)) return {priority: 3, user}
  //   else return {priority: 4, user}
  // })
  // .sort((userA, userB) => (userA.priority > userB.priority ? 1 : -1))
  // .sort((userA, userB) => {
  //   // second level sort: collaborators show up first
  //   if (
  //     data.collaborators.find(c => c.id === userA.user.id) &&
  //     !data.collaborators.find(c => c.id === userB.user.id)
  //   ) {
  //     return -1
  //   } else return 1
  // })
  // .map(result => result.user)
}

/* lifted from the examples at https://react.dev/reference/react/Suspense */
// @ts-ignore copied from untyped example
function use(promise) {
  if (promise.status === 'fulfilled') {
    return promise.value
  } else if (promise.status === 'rejected') {
    throw promise.reason
  } else if (promise.status === 'pending') {
    throw promise
  } else {
    promise.status = 'pending'

    // eslint-disable-next-line github/no-then
    promise.then(
      (result: Record<string, unknown>) => {
        promise.status = 'fulfilled'
        promise.value = result
      },
      (error: Error) => {
        promise.status = 'rejected'
        promise.reason = error
      },
    )
    throw promise
  }
}

export default {
  title: 'Drafts/Components/SelectPanel',
  component: SelectPanel,
}